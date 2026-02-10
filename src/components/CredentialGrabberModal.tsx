import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../constants/theme';

const TARGET_URL = 'https://freeiptv2023-d.ottc.xyz/';
const POLL_INTERVAL_MS = 2000;

export interface GrabbedCredentials {
    serverUrl: string;
    username: string;
    password: string;
    m3uLink?: string;
    activationTime?: string;
    expirationTime?: string;
}

interface Props {
    visible: boolean;
    onClose: () => void;
    onCredentialsGrabbed: (creds: GrabbedCredentials) => void;
}

// ─── Anti-Detection ────────────────────────────────────────
// Property-trap approach: intercepts the bridge's set of
// ReactNativeWebView, hides it from Turnstile (getter returns
// undefined), and exposes postMessage via window.__rnPost.
const ANTI_DETECTION_SCRIPT = `
(function() {
    var __origPost = null;

    // If the bridge already set it, capture before hiding
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        __origPost = window.ReactNativeWebView.postMessage.bind(window.ReactNativeWebView);
    }

    // Property trap: capture future assignments, hide from reads
    Object.defineProperty(window, 'ReactNativeWebView', {
        configurable: true,
        enumerable: false,
        get: function() { return undefined; },
        set: function(val) {
            if (val && val.postMessage) {
                __origPost = val.postMessage.bind(val);
            }
        },
    });

    // Expose postMessage via a hidden alias
    window.__rnPost = function(data) {
        if (__origPost) __origPost(data);
    };

    // Webdriver flag
    try {
        Object.defineProperty(navigator, 'webdriver', {
            get: function() { return false; },
            configurable: true,
        });
    } catch(e) {}
})();
true;
`;

// ─── Page State Script ─────────────────────────────────────
const PAGE_STATE_SCRIPT = `
(function() {
    var post = window.__rnPost;
    if (!post) return;

    var body = document.body ? document.body.innerText : '';
    var hasResults = body.includes('IPTV account information') || body.includes('Server URL');
    var createBtn = document.querySelector('#create-btn');
    var hasCreateBtn = !!createBtn;
    var btnDisabled = hasCreateBtn ? createBtn.disabled : false;

    post(JSON.stringify({
        type: 'pageState',
        data: { hasResults: hasResults, hasCreateBtn: hasCreateBtn, btnDisabled: btnDisabled },
    }));
})();
true;
`;

// ─── Extraction Script ─────────────────────────────────────
// Reads input values from the DOM to get the credentials.
const EXTRACTION_SCRIPT = `
(function() {
    var post = window.__rnPost;
    if (!post) return;
    if (window.__iptvExtracted) return;

    var details = {
        serverUrl: null, username: null, password: null,
        m3uLink: null, activationTime: null, expirationTime: null,
    };

    // Strategy: Read ALL inputs/textareas and match by label association
    var allInputs = document.querySelectorAll('input, textarea');
    
    for (var i = 0; i < allInputs.length; i++) {
        var inp = allInputs[i];
        var val = (inp.value || inp.getAttribute('value') || '').trim();
        if (!val) continue;

        // Find the associated label — check: label[for], parent text, placeholder
        var labelText = '';
        if (inp.id) {
            var lbl = document.querySelector('label[for="' + inp.id + '"]');
            if (lbl) labelText = lbl.textContent.trim().toLowerCase();
        }
        if (!labelText) {
            var parent = inp.parentElement;
            if (parent) {
                var parentLabel = parent.querySelector('label');
                if (parentLabel) labelText = parentLabel.textContent.trim().toLowerCase();
            }
        }
        if (!labelText) {
            labelText = (inp.placeholder || inp.id || '').toLowerCase();
        }

        if (labelText.includes('server') && !details.serverUrl) details.serverUrl = val;
        else if (labelText.includes('username') && !details.username) details.username = val;
        else if (labelText.includes('password') && !details.password) details.password = val;
        else if ((labelText.includes('m3u') || labelText.includes('download')) && !details.m3uLink) details.m3uLink = val;
        else if (labelText.includes('activation') && !details.activationTime) details.activationTime = val;
        else if (labelText.includes('expiration') && !details.expirationTime) details.expirationTime = val;
    }

    if (details.serverUrl && details.username && details.password) {
        window.__iptvExtracted = true;
        post(JSON.stringify({ type: 'credentials', data: details }));
    } else {
        post(JSON.stringify({ type: 'extractionFailed' }));
    }
})();
true;
`;

type GrabberStatus = 'loading' | 'turnstile' | 'ready' | 'extracting' | 'done' | 'error';

const STATUS_CONFIG: Record<GrabberStatus, { icon: string; label: string; color: string }> = {
    loading: { icon: 'globe-outline', label: 'Loading page...', color: colors.textSecondary },
    turnstile: { icon: 'shield-checkmark-outline', label: 'Waiting for security check...', color: colors.warning },
    ready: { icon: 'hand-left-outline', label: 'Tap "Create free IPTV account !"', color: colors.primary },
    extracting: { icon: 'search-outline', label: 'Extracting credentials...', color: colors.primary },
    done: { icon: 'checkmark-circle', label: 'Credentials grabbed!', color: colors.success },
    error: { icon: 'alert-circle-outline', label: 'Something went wrong', color: colors.error },
};

export default function CredentialGrabberModal({ visible, onClose, onCredentialsGrabbed }: Props) {
    const webViewRef = useRef<WebView>(null);
    const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const extractRetryRef = useRef(0);
    const [status, setStatus] = useState<GrabberStatus>('loading');

    useEffect(() => {
        if (!visible) {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            extractRetryRef.current = 0;
            setStatus('loading');
        }
    }, [visible]);

    const startPolling = useCallback(() => {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        pollTimerRef.current = setInterval(() => {
            webViewRef.current?.injectJavaScript(PAGE_STATE_SCRIPT);
        }, POLL_INTERVAL_MS);
    }, []);

    const handleMessage = useCallback((event: WebViewMessageEvent) => {
        try {
            const msg = JSON.parse(event.nativeEvent.data);
            if (msg.type === 'pageState') {
                const { hasResults, hasCreateBtn, btnDisabled } = msg.data;
                if (hasResults) {
                    setStatus('extracting');
                    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
                    setTimeout(() => {
                        webViewRef.current?.injectJavaScript(EXTRACTION_SCRIPT);
                    }, 2000);
                } else if (hasCreateBtn && btnDisabled) {
                    setStatus('turnstile');
                } else if (hasCreateBtn && !btnDisabled) {
                    setStatus('ready');
                }
            } else if (msg.type === 'credentials') {
                setStatus('done');
                if (pollTimerRef.current) clearInterval(pollTimerRef.current);
                extractRetryRef.current = 0;
                const creds: GrabbedCredentials = msg.data;
                setTimeout(() => onCredentialsGrabbed(creds), 600);
            } else if (msg.type === 'extractionFailed') {
                if (extractRetryRef.current < 5) {
                    extractRetryRef.current += 1;
                    setTimeout(() => {
                        webViewRef.current?.injectJavaScript(EXTRACTION_SCRIPT);
                    }, 2000);
                } else {
                    setStatus('error');
                    Alert.alert('Extraction Failed', 'Could not find credentials on the page. Please try again.');
                }
            }
        } catch {
            // Ignore non-JSON messages
        }
    }, [onCredentialsGrabbed]);

    const handleLoadEnd = useCallback(() => {
        startPolling();
    }, [startPolling]);

    const handleNavigationChange = useCallback((navState: { url: string }) => {
        if (navState.url && navState.url !== TARGET_URL) {
            setStatus('extracting');
        }
    }, []);

    const currentStatus = STATUS_CONFIG[status];

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.modalContainer}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Ionicons
                            name="flash"
                            size={20}
                            color={colors.primary}
                            style={{ marginRight: spacing.sm }}
                        />
                        <Text style={styles.headerTitle}>Grab Credentials</Text>
                    </View>
                    <TouchableOpacity
                        onPress={onClose}
                        style={styles.closeBtn}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="close" size={22} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Status Banner */}
                <View style={[styles.statusBanner, { borderLeftColor: currentStatus.color }]}>
                    <Ionicons
                        name={currentStatus.icon as any}
                        size={18}
                        color={currentStatus.color}
                        style={{ marginRight: spacing.sm }}
                    />
                    <Text style={[styles.statusText, { color: currentStatus.color }]}>
                        {currentStatus.label}
                    </Text>
                    {(status === 'loading' || status === 'turnstile' || status === 'extracting') && (
                        <ActivityIndicator
                            size="small"
                            color={currentStatus.color}
                            style={{ marginLeft: spacing.sm }}
                        />
                    )}
                </View>

                {/* WebView */}
                <View style={styles.webViewContainer}>
                    <WebView
                        ref={webViewRef}
                        source={{ uri: TARGET_URL }}
                        style={styles.webView}
                        onLoadEnd={handleLoadEnd}
                        onMessage={handleMessage}
                        onNavigationStateChange={handleNavigationChange}
                        injectedJavaScriptBeforeContentLoaded={ANTI_DETECTION_SCRIPT}
                        javaScriptEnabled
                        domStorageEnabled
                        originWhitelist={['http://*', 'https://*', 'about:*', 'data:*']}
                        onShouldStartLoadWithRequest={() => true}
                        sharedCookiesEnabled
                        thirdPartyCookiesEnabled
                        allowsInlineMediaPlayback
                        javaScriptCanOpenWindowsAutomatically
                        mixedContentMode="always"
                    />
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        ...typography.subtitle,
        color: colors.text,
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: borderRadius.full,
        backgroundColor: colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderLeftWidth: 3,
        marginHorizontal: spacing.lg,
        marginTop: spacing.md,
        borderRadius: borderRadius.md,
        ...shadows.sm,
    },
    statusText: {
        ...typography.caption,
        fontWeight: '600',
        flex: 1,
    },
    webViewContainer: {
        flex: 1,
        margin: spacing.lg,
        marginTop: spacing.md,
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        backgroundColor: colors.surface,
        ...shadows.card,
    },
    webView: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
});

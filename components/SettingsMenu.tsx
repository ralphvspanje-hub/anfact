import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Modal,
  Alert,
  Linking,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth';
import EmailAuthModal from './EmailAuthModal';
import NameEntryModal from './NameEntryModal';
import JokeModal from './JokeModal';

const isWeb = Platform.OS === 'web';

/* ── Shared menu content ─────────────────────────────── */

const PRIVACY_URL = 'https://anfact.app/privacy';
const TERMS_URL = 'https://anfact.app/terms';

const MenuContent = ({
  onLoginPress,
  onDeleteAccount,
}: {
  onLoginPress: () => void;
  onDeleteAccount: () => void;
}) => {
  const { theme } = useTheme();
  const { isLoggedIn, userName, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  return (
    <>
      <Text
        style={[
          styles.menuTitle,
          { color: theme.colors.text, fontFamily: 'Nunito-Bold' },
        ]}
      >
        Settings
      </Text>

      <View
        style={[styles.menuDivider, { backgroundColor: theme.colors.border }]}
      />

      {/* Auth row */}
      {isLoggedIn ? (
        <>
          <View style={styles.menuRow}>
            <View style={styles.menuRowLeft}>
              <Ionicons
                name="person-outline"
                size={18}
                color={theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.menuRowLabel,
                  { color: theme.colors.text, fontFamily: 'Nunito-Regular' },
                ]}
                numberOfLines={1}
              >
                {userName}
              </Text>
            </View>
          </View>
          <Pressable style={styles.menuRow} onPress={handleLogout}>
            <View style={styles.menuRowLeft}>
              <Ionicons
                name="log-out-outline"
                size={18}
                color={theme.colors.error}
              />
              <Text
                style={[
                  styles.menuRowLabel,
                  { color: theme.colors.error, fontFamily: 'Nunito-Regular' },
                ]}
              >
                Log out
              </Text>
            </View>
          </Pressable>
        </>
      ) : (
        <Pressable style={styles.menuRow} onPress={onLoginPress}>
          <View style={styles.menuRowLeft}>
            <Ionicons
              name="log-in-outline"
              size={18}
              color={theme.colors.primary}
            />
            <Text
              style={[
                styles.menuRowLabel,
                { color: theme.colors.primary, fontFamily: 'Nunito-Regular' },
              ]}
            >
              Log in / Register
            </Text>
          </View>
        </Pressable>
      )}

      <View
        style={[styles.menuDivider, { backgroundColor: theme.colors.border }]}
      />

      <View style={styles.menuRow}>
        <View style={styles.menuRowLeft}>
          <Ionicons
            name="contrast-outline"
            size={18}
            color={theme.colors.textSecondary}
          />
          <Text
            style={[
              styles.menuRowLabel,
              { color: theme.colors.text, fontFamily: 'Nunito-Regular' },
            ]}
          >
            Theme
          </Text>
        </View>
        <ThemeToggle />
      </View>

      <View
        style={[styles.menuDivider, { backgroundColor: theme.colors.border }]}
      />

      <Pressable style={styles.menuRow} onPress={() => Linking.openURL(PRIVACY_URL)}>
        <View style={styles.menuRowLeft}>
          <Ionicons name="shield-outline" size={18} color={theme.colors.textSecondary} />
          <Text style={[styles.menuRowLabel, { color: theme.colors.text, fontFamily: 'Nunito-Regular' }]}>
            Privacy Policy
          </Text>
        </View>
      </Pressable>

      <Pressable style={styles.menuRow} onPress={() => Linking.openURL(TERMS_URL)}>
        <View style={styles.menuRowLeft}>
          <Ionicons name="document-text-outline" size={18} color={theme.colors.textSecondary} />
          <Text style={[styles.menuRowLabel, { color: theme.colors.text, fontFamily: 'Nunito-Regular' }]}>
            Terms of Service
          </Text>
        </View>
      </Pressable>

      {isLoggedIn && (
        <>
          <View
            style={[styles.menuDivider, { backgroundColor: theme.colors.border }]}
          />
          <Pressable style={styles.menuRow} onPress={onDeleteAccount}>
            <View style={styles.menuRowLeft}>
              <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
              <Text style={[styles.menuRowLabel, { color: theme.colors.error, fontFamily: 'Nunito-Regular' }]}>
                Delete account
              </Text>
            </View>
          </Pressable>
        </>
      )}
    </>
  );
};

/* ── Main component ──────────────────────────────────── */

export const SettingsMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [emailAuthModalVisible, setEmailAuthModalVisible] = useState(false);
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [jokeModalVisible, setJokeModalVisible] = useState(false);
  const { theme } = useTheme();
  const { loginWithEmail, register, login, markOnboardingComplete, deleteAccount } = useAuth();
  const containerRef = useRef<View>(null);
  const progress = useSharedValue(0);

  const open = useCallback(() => {
    setIsOpen(true);
    progress.value = withTiming(1, { duration: 200 });
  }, []);

  const close = useCallback((onClosed?: () => void) => {
    const afterClose = () => {
      setIsOpen(false);
      onClosed?.();
    };
    progress.value = withTiming(0, { duration: 150 }, (finished) => {
      if (finished) {
        runOnJS(afterClose)();
      }
    });
  }, []);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, close, open]);

  const handleLoginPress = useCallback(() => {
    close(() => setEmailAuthModalVisible(true));
  }, [close]);

  const handleSettingsRegister = useCallback(async (email: string, password: string): Promise<'success' | 'pending_confirmation'> => {
    const result = await register(email, password);
    if (result.status === 'success') {
      setEmailAuthModalVisible(false);
      setNameModalVisible(true);
    }
    return result.status;
  }, [register]);

  const handleSettingsLogin = useCallback(async (email: string, password: string) => {
    const user = await loginWithEmail(email, password);
    setEmailAuthModalVisible(false);
    if (!user.name) {
      setNameModalVisible(true);
    }
  }, [loginWithEmail]);

  const handleSettingsEmailDismiss = useCallback(() => {
    setEmailAuthModalVisible(false);
  }, []);

  const handleSettingsNameSubmit = useCallback(async (name: string) => {
    await login(name);
    setNameModalVisible(false);
    setJokeModalVisible(true);
  }, [login]);

  const handleSettingsNameDismiss = useCallback(() => {
    setNameModalVisible(false);
  }, []);

  const handleSettingsJokeConfirm = useCallback(async () => {
    await markOnboardingComplete();
    setJokeModalVisible(false);
  }, [markOnboardingComplete]);

  const handleDeleteAccount = useCallback(() => {
    close(() => {
      Alert.alert(
        'Delete account',
        'Are you sure? This will permanently delete your account. Your leaderboard entry will be kept.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteAccount();
              } catch (err) {
                console.error('Delete account failed', err);
                Alert.alert('Error', 'Failed to delete account. Please try again.');
              }
            },
          },
        ],
      );
    });
  }, [close, deleteAccount]);

  /* ── Web: click-outside detection ── */
  useEffect(() => {
    if (!isWeb || !isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const node = containerRef.current as unknown as HTMLElement | null;
      if (node && !node.contains(e.target as Node)) {
        close();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, close]);

  /* ── Animation styles ── */
  const dropdownStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: -8 + progress.value * 8 }],
  }));

  const backdropAnimStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const sheetAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * 300 }],
  }));

  /* ── Web variant ── */
  if (isWeb) {
    return (
      <View ref={containerRef} style={styles.container}>
        <Pressable
          onPress={toggle}
          style={({ pressed }) => [
            styles.gearButton,
            {
              opacity: pressed ? 0.7 : 1,
              backgroundColor: theme.colors.surfaceHighlight,
            },
          ]}
        >
          <Ionicons
            name={isOpen ? 'settings' : 'settings-outline'}
            size={20}
            color={theme.colors.primary}
          />
        </Pressable>

        {isOpen && (
          <Animated.View
            style={[
              styles.webDropdown,
              dropdownStyle,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <MenuContent onLoginPress={handleLoginPress} onDeleteAccount={handleDeleteAccount} />
          </Animated.View>
        )}

        <EmailAuthModal
          visible={emailAuthModalVisible}
          onRegister={handleSettingsRegister}
          onLogin={handleSettingsLogin}
          onForgotPassword={(email) => authService.resetPassword(email)}
          onDismiss={handleSettingsEmailDismiss}
        />
        <NameEntryModal
          visible={nameModalVisible}
          onSubmit={handleSettingsNameSubmit}
          onDismiss={handleSettingsNameDismiss}
        />
        <JokeModal
          visible={jokeModalVisible}
          onConfirm={handleSettingsJokeConfirm}
        />
      </View>
    );
  }

  /* ── Native variant ── */
  return (
    <View style={styles.container}>
      <Pressable
        onPress={toggle}
        style={({ pressed }) => [
          styles.gearButton,
          {
            opacity: pressed ? 0.7 : 1,
            backgroundColor: theme.colors.surfaceHighlight,
          },
        ]}
      >
        <Ionicons
          name={isOpen ? 'settings' : 'settings-outline'}
          size={20}
          color={theme.colors.primary}
        />
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={() => close()}
        statusBarTranslucent
      >
        <View style={styles.nativeContainer}>
          {/* Backdrop */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.nativeBackdrop,
              backdropAnimStyle,
            ]}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={() => close()} />
          </Animated.View>

          {/* Bottom sheet */}
          <Animated.View
            style={[
              styles.nativeSheet,
              sheetAnimStyle,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.nativeHandle,
                { backgroundColor: theme.colors.border },
              ]}
            />
            <MenuContent onLoginPress={handleLoginPress} onDeleteAccount={handleDeleteAccount} />
          </Animated.View>
        </View>
      </Modal>

      <EmailAuthModal
        visible={emailAuthModalVisible}
        onRegister={handleSettingsRegister}
        onLogin={handleSettingsLogin}
        onForgotPassword={(email) => authService.resetPassword(email)}
        onDismiss={handleSettingsEmailDismiss}
      />
      <NameEntryModal
        visible={nameModalVisible}
        onSubmit={handleSettingsNameSubmit}
        onDismiss={handleSettingsNameDismiss}
      />
      <JokeModal
        visible={jokeModalVisible}
        onConfirm={handleSettingsJokeConfirm}
      />
    </View>
  );
};

/* ── Styles ───────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginRight: 16,
    marginTop: -8,
  },

  gearButton: {
    padding: 8,
    borderRadius: 20,
  },

  /* Menu content */
  menuTitle: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },

  menuDivider: {
    height: 1,
    marginHorizontal: 12,
  },

  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  menuRowLabel: {
    fontSize: 14,
  },

  /* Web dropdown */
  webDropdown: {
    position: 'absolute',
    top: '100%' as unknown as number,
    right: 0,
    marginTop: 8,
    minWidth: 220,
    borderRadius: 12,
    borderWidth: 1,
    paddingBottom: 4,
    zIndex: 1000,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)',
      } as any,
      default: {},
    }),
  },

  /* Native bottom sheet */
  nativeContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  nativeBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  nativeSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingBottom: 32,
  },

  nativeHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
});

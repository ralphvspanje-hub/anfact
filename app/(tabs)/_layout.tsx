import { Tabs } from 'expo-router';
import { View, Text, Image, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { SettingsMenu } from '../../components/SettingsMenu';
import { HeaderBar } from '../../components/HeaderBar';

const isWeb = Platform.OS === 'web';

const BRAND_GREEN = '#7aa087';

/** Small logo shown in the native mobile header (matches web HeaderBar logo). */
function MobileLogo() {
  return (
    <View style={mobileLogoStyles.container}>
      <Image
        source={require('../../assets/AnFact_Logo_Green_A_NoBg.png')}
        style={mobileLogoStyles.image}
        resizeMode="contain"
      />
      <Text style={mobileLogoStyles.text}>nFact</Text>
    </View>
  );
}

const mobileLogoStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginLeft: 4,
  },
  image: {
    width: 30,
    height: 30,
  },
  text: {
    fontFamily: 'LeagueSpartan-Bold',
    fontSize: 22,
    color: BRAND_GREEN,
    marginLeft: -6,
    marginBottom: 1,
  },
});

export default function TabLayout() {
  const { theme } = useTheme();

  return (
    <View style={{ flex: 1 }}>
      {isWeb && <HeaderBar />}
      <Tabs
        screenOptions={{
          // On web: hide default header (replaced by HeaderBar)
          // On native: keep the default header
          headerShown: !isWeb,
          headerStyle: {
            backgroundColor: theme.colors.background,
            elevation: 0, // Android shadow
            shadowOpacity: 0, // iOS shadow
          },
          headerTintColor: theme.colors.text,
          headerTitleStyle: {
            fontFamily: 'Nunito-Bold',
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textSecondary,
          tabBarShowLabel: true,
          tabBarStyle: isWeb
            ? { display: 'none' as const }
            : {
                backgroundColor: theme.colors.surface,
                borderTopColor: theme.colors.border,
              },
          // Set content background color
          sceneContainerStyle: {
            backgroundColor: theme.colors.background,
          },
          // On native, show logo on the left and Settings on the right
          headerLeft: !isWeb ? () => <MobileLogo /> : undefined,
          headerTitle: !isWeb ? '' : undefined,
          headerRight: !isWeb ? () => <SettingsMenu /> : undefined,
        }}
      >
        <Tabs.Screen
          name="library"
          options={{
            title: 'Library',
            tabBarLabel: 'Library',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="library" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: 'Search',
            tabBarLabel: 'Search',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="search" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="recall"
          options={{
            title: 'Recall',
            tabBarLabel: 'Recall',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="school" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

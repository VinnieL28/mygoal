import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing } from '../theme/theme';

import DashboardScreen from '../screens/DashboardScreen';
import HistoryScreen from '../screens/HistoryScreen';
import GoalsScreen from '../screens/GoalsScreen';
import InsightsScreen from '../screens/InsightsScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import WalletsScreen from '../screens/WalletsScreen';
import WalletDetailScreen from '../screens/WalletDetailScreen';
import WalletFormScreen from '../screens/WalletFormScreen';
import GoalFormScreen from '../screens/GoalFormScreen';
import SettingsScreen from '../screens/SettingsScreen';
import BillsScreen from '../screens/BillsScreen';
import BillFormScreen from '../screens/BillFormScreen';
import MonthlyOverviewScreen from '../screens/MonthlyOverviewScreen';
import PinSetupScreen from '../screens/PinSetupScreen';
import AddTabButton from '../components/AddTabButton';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.bg,
    primary: colors.gold,
    text: colors.text,
    border: 'transparent',
    notification: colors.gold,
  },
};

function PlaceholderAdd() {
  return <View />;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 4,
        },
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            <View style={styles.tabBarBg} />
            <View style={styles.tabBarBorder} />
          </View>
        ),
        tabBarIcon: ({ color, focused }) => {
          const map = {
            Dashboard: focused ? 'home' : 'home-outline',
            History: focused ? 'calendar' : 'calendar-outline',
            Goals: focused ? 'flag' : 'flag-outline',
            Insights: focused ? 'pulse' : 'pulse-outline',
          };
          const name = map[route.name] || 'ellipse-outline';
          return <Ionicons name={name} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen
        name="Add"
        component={PlaceholderAdd}
        options={{
          tabBarButton: (props) => <AddTabButton {...props} />,
          tabBarLabel: () => null,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('AddTransaction');
          },
        })}
      />
      <Tab.Screen name="Goals" component={GoalsScreen} />
      <Tab.Screen name="Insights" component={InsightsScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_bottom',
        }}
      >
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen
          name="AddTransaction"
          component={AddTransactionScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="Wallets" component={WalletsScreen} />
        <Stack.Screen name="WalletDetail" component={WalletDetailScreen} />
        <Stack.Screen
          name="WalletForm"
          component={WalletFormScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="GoalForm"
          component={GoalFormScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Bills" component={BillsScreen} />
        <Stack.Screen
          name="BillForm"
          component={BillFormScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="MonthlyOverview" component={MonthlyOverviewScreen} />
        <Stack.Screen
          name="PinSetup"
          component={PinSetupScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: Platform.OS === 'ios' ? 24 : 16,
    height: 68,
    borderRadius: radius.xl,
    borderTopWidth: 0,
    elevation: 12,
    paddingHorizontal: spacing.sm,
  },
  tabBarBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xl,
  },
  tabBarBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

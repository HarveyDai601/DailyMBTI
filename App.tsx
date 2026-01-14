import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from './src/screens/HomeScreen';
import { TestScreen } from './src/screens/TestScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { StatusBar } from 'expo-status-bar';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="Test"
          component={TestScreen}
          options={{ title: 'MBTI 测试', headerBackVisible: false }}
        />
        <Stack.Screen name="Result" component={ResultScreen} options={{ title: '结果' }} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}


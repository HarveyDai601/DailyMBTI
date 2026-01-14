import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  Test: undefined;
  Result: { code: string; summary: any } | undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

export const ResultScreen: React.FC<Props> = ({ navigation, route }) => {
  const { code, summary } = route.params || { code: '----', summary: {} };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>你的MBTI</Text>
      <View style={styles.card}>
        <Text style={styles.code}>{code}</Text>
      </View>

      <View style={{ marginTop: 16 }}>
        {Object.keys(summary || {}).map(k => (
          <Text key={k} style={styles.dimText}>
            {k}: {summary[k].letter} (θ={summary[k].theta.toFixed(2)})
          </Text>
        ))}
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
      >
        <Text style={styles.buttonText}>重新测试</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '700', marginTop: 40 },
  card: { marginTop: 24, padding: 24, borderRadius: 12, backgroundColor: '#f1f1f1' },
  code: { fontSize: 48, fontWeight: '900', letterSpacing: 6 },
  button: { marginTop: 32, backgroundColor: '#007AFF', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  dimText: { marginTop: 6, color: '#333' },
});

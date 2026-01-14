import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IRTModel, IRTItem } from '../irt/IRTModel';

const questionsJson = require('../../contents/questions.json');

type RootStackParamList = {
  Home: undefined;
  Test: undefined;
  Result: { code: string; summary: any } | undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Test'>;

export const TestScreen: React.FC<Props> = ({ navigation }) => {
  // flatten questions into list with dimension key
  const allQuestions = useMemo(() => {
    const dims = questionsJson.mbti_question_bank.dimensions as any[];
    const flat: any[] = [];
    for (const d of dims) {
      // dimension_name like "E-I（外向-内向）"
      // Extract prefix like E-I
      const match = d.dimension_name.match(/[A-Z]-[A-Z]/);
      const dimKey = match ? match[0] : d.dimension_name;
      for (const q of d.questions) {
        flat.push({ ...q, dimKey });
      }
    }
    // take first 100
    return flat.slice(0, 100);
  }, []);

  const total = allQuestions.length;
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ [qid: string]: number }>({});

  useEffect(() => {
    // disable back gestures by setting options
    navigation.setOptions({ headerLeft: () => null, gestureEnabled: false });
  }, [navigation]);

  const current = allQuestions[index];

  const onNext = () => {
    if (selected == null) {
      Alert.alert('请先选择一个选项');
      return;
    }
    const newAnswers = { ...answers, [current.qid]: selected };
    setAnswers(newAnswers);
    setSelected(null);
    if (index + 1 >= total) {
      // finish and compute MBTI
      // group items by dimension
      const byDim: { [dimKey: string]: IRTItem[] } = {};
      for (const q of allQuestions) {
        const sc = q.scoring_rule && q.scoring_rule.score_mapping ? q.scoring_rule.score_mapping : { '1': 0, '2': 0.25, '3': 0.5, '4': 0.75, '5': 1 };
        const item: IRTItem = {
          qid: q.qid,
          a: q.irt_params.a,
          b: [q.irt_params.b1, q.irt_params.b2, q.irt_params.b3, q.irt_params.b4],
          scoreMapping: sc,
        };
        if (!byDim[q.dimKey]) byDim[q.dimKey] = [];
        byDim[q.dimKey].push(item);
      }
      // compute
      const result = IRTModel.computeMBTI(byDim, newAnswers);
      navigation.replace('Result', { code: result.code, summary: result.summary });
    } else {
      setIndex(index + 1);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.qCount}>第 {index + 1} 题 / 共 {total} 题</Text>
      <View style={styles.card}>
        <Text style={styles.question}>{current.question_text}</Text>
        <View style={styles.options}>
          {[1, 2, 3, 4, 5].map(k => (
            <TouchableOpacity
              key={k}
              style={[styles.option, selected === k && styles.optionSelected]}
              onPress={() => setSelected(k)}
            >
              <Text style={[styles.optionText, selected === k && styles.optionTextSelected]}>{k}</Text>
              <Text style={styles.optionLabel}>{getOptionLabel(k)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.nextButton} onPress={onNext}>
          <Text style={styles.nextText}>{index + 1 >= total ? '提交并计算' : '下一题'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

function getOptionLabel(k: number) {
  switch (k) {
    case 1:
      return '非常不符合';
    case 2:
      return '不符合';
    case 3:
      return '不确定';
    case 4:
      return '符合';
    case 5:
      return '非常符合';
    default:
      return '';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  qCount: { textAlign: 'center', marginBottom: 8, fontSize: 14, color: '#666' },
  card: { backgroundColor: '#f8f8f8', padding: 16, borderRadius: 8 },
  question: { fontSize: 18, marginBottom: 12 },
  options: { marginTop: 8 },
  option: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 6, borderWidth: 1, borderColor: '#ddd', marginBottom: 8 },
  optionSelected: { backgroundColor: '#007aff22', borderColor: '#007AFF' },
  optionText: { width: 28, fontWeight: '700', color: '#333' },
  optionTextSelected: { color: '#007AFF' },
  optionLabel: { marginLeft: 8, color: '#333' },
  nextButton: { marginTop: 12, backgroundColor: '#007AFF', padding: 12, borderRadius: 8, alignItems: 'center' },
  nextText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

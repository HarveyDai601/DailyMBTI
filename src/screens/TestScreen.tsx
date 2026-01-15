import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IRTModel, IRTItem } from '../irt/IRTModel';
import { QuestionGenerator, Question } from '../irt/QuestionGenerator';

const questionsJson = require('../../contents/questions.json');

type RootStackParamList = {
  Home: undefined;
  Test: undefined;
  Result: { code: string; summary: any } | undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Test'>;

const { width } = Dimensions.get('window');

// Color constants
const COLORS = {
  background: '#F5F6FA',
  optionBorder: {
    5: '#03CB95', // 完全符合
    4: '#6ADA7D', // 符合
    3: '#C4CBCB', // 中间
    2: '#FFB57F', // 不符合
    1: '#FF8A80', // 完全不符合
  },
};

export const TestScreen: React.FC<Props> = ({ navigation }) => {
  const generator = useMemo(() => new QuestionGenerator(questionsJson), []);
  const questionsPerPage = 5;
  const allQuestions = useMemo(() => generator.generateQuestions({ totalQuestions: 100, questionsPerPage, shuffle: false }), [generator]);
  const totalPages = useMemo(() => generator.getTotalPages(allQuestions.length, questionsPerPage), [allQuestions.length, questionsPerPage]);

  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState<{ [qid: string]: number }>({});

  useEffect(() => {
    navigation.setOptions({ headerLeft: () => null, gestureEnabled: false });
  }, [navigation]);

  const currentQuestions = allQuestions.slice(currentPage * questionsPerPage, (currentPage + 1) * questionsPerPage);
  const completedQuestions = Object.keys(answers).length;
  const progress = completedQuestions / allQuestions.length;

  const isPageComplete = currentQuestions.every(q => answers[q.qid] != null);

  const onSelect = (qid: string, value: number) => {
    setAnswers(prev => ({ ...prev, [qid]: value }));
  };

  const onNext = () => {
    if (!isPageComplete) {
      Alert.alert('请完成本页所有题目');
      return;
    }
    if (currentPage + 1 >= totalPages) {
      // finish and compute MBTI
      const byDim: { [dimKey: string]: IRTItem[] } = {};
      for (const q of allQuestions) {
        const sc = q.scoring_rule.score_mapping || { '1': 0, '2': 0.25, '3': 0.5, '4': 0.75, '5': 1 };
        const item: IRTItem = {
          qid: q.qid,
          a: q.irt_params.a,
          b: [q.irt_params.b1, q.irt_params.b2, q.irt_params.b3, q.irt_params.b4],
          scoreMapping: sc,
        };
        if (!byDim[q.dimKey]) byDim[q.dimKey] = [];
        byDim[q.dimKey].push(item);
      }
      const result = IRTModel.computeMBTI(byDim, answers);
      navigation.replace('Result', { code: result.code, summary: result.summary });
    } else {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <Text style={styles.qCount}>第 {currentPage + 1} 页 / 共 {totalPages} 页 ({completedQuestions}/{allQuestions.length})</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: width * 0.8 * progress }]} />
        </View>
      </View>
      <ScrollView style={styles.scrollView}>
        {currentQuestions.map((q, idx) => (
          <View key={q.qid} style={styles.questionCard}>
            <Text style={styles.questionText}>{q.question_text}</Text>
            <View style={styles.optionsRow}>
              {[5, 4, 3, 2, 1].map(k => (
                <TouchableOpacity
                  key={k}
                  style={[
                    styles.optionCircle,
                    { 
                        backgroundColor: getOptionFillColor(k),
                        borderColor: getOptionsBorderColor(k),
                    },
                    answers[q.qid] === k && styles.optionSelected,
                  ]}
                  onPress={() => onSelect(q.qid, k)}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity
        style={[styles.nextButton, !isPageComplete && styles.nextButtonDisabled]}
        onPress={onNext}
        disabled={!isPageComplete}
      >
        <Text style={styles.nextText}>
          {currentPage + 1 >= totalPages ? '提交并计算' : '下一页'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

function getOptionFillColor(k: number): string {
  const hex = COLORS.optionBorder[k as keyof typeof COLORS.optionBorder];
  // Convert hex to rgba with 0.8 opacity
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, 0.3)`;
}

function getOptionsBorderColor(k: number): string {
  return COLORS.optionBorder[k as keyof typeof COLORS.optionBorder];
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  progressContainer: { marginBottom: 16, backgroundColor: COLORS.background, padding: 16, borderRadius: 8 },
  qCount: { textAlign: 'center', marginBottom: 8, fontSize: 14, color: '#666' },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    width: width * 0.8,
    alignSelf: 'center',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  scrollView: { flex: 1, backgroundColor: COLORS.background },
  questionCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  questionText: { fontSize: 16, marginBottom: 12 },
  optionsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  optionCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
  },
  optionSelected: {
    borderWidth: 4,
  },
  nextButton: { marginTop: 12, backgroundColor: '#007AFF', padding: 12, borderRadius: 8, alignItems: 'center' },
  nextButtonDisabled: { backgroundColor: '#ccc' },
  nextText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

const LearningTypeSelectionScreen = ({ navigation, route }) => {
  const { selectedLanguage } = route.params || {};

  const handleLearningTypeSelect = (learningType) => {
    // Navigate to topic selection with the chosen learning type
    navigation.navigate('TopicSelection', {
      selectedLanguage,
      learningType, // 'tables' or 'words'
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What would you like to practice?</Text>
      <Text style={styles.subtitle}>Choose your learning focus</Text>

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => handleLearningTypeSelect('tables')}
        >
          <View style={styles.optionIcon}>
            <Text style={styles.iconText}>📊</Text>
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Grammar Tables</Text>
            <Text style={styles.optionDescription}>
              Practice verb conjugations, declensions, and other structured grammar patterns
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => handleLearningTypeSelect('words')}
        >
          <View style={styles.optionIcon}>
            <Text style={styles.iconText}>📚</Text>
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Vocabulary Words</Text>
            <Text style={styles.optionDescription}>
              Learn new words and phrases through interactive exercises
            </Text>
            <Text style={styles.comingSoon}>Coming Soon</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back to Languages</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 10,
    color: '#333',
    fontFamily: 'ComicSansMS',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
    fontFamily: 'ComicSansMS',
  },
  optionsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
  },
  optionCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  iconText: {
    fontSize: 24,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    fontFamily: 'ComicSansMS',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontFamily: 'ComicSansMS',
  },
  comingSoon: {
    fontSize: 12,
    color: '#ff9800',
    fontWeight: 'bold',
    marginTop: 8,
    fontFamily: 'ComicSansMS',
  },
  footer: {
    paddingBottom: 20,
    alignItems: 'center',
  },
  backButton: {
    padding: 12,
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
    fontFamily: 'ComicSansMS',
  },
});

export default LearningTypeSelectionScreen;

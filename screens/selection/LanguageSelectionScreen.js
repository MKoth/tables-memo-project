import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

const LanguageSelectionScreen = ({ navigation }) => {
  const languages = [
    { id: 'english', name: 'English', flag: '🇺🇸' },
    { id: 'spanish', name: 'Spanish', flag: '🇪🇸' },
    { id: 'french', name: 'French', flag: '🇫🇷' },
    { id: 'german', name: 'German', flag: '🇩🇪' },
    { id: 'italian', name: 'Italian', flag: '🇮🇹' },
    { id: 'portuguese', name: 'Portuguese', flag: '🇵🇹' },
  ];

  const handleLanguageSelect = (language) => {
    // TODO: Store selected language in context
    // Navigate to learning type selection with selected language
    navigation.navigate('LearningTypeSelection', { selectedLanguage: language });
  };

  const handlePersonalProject = () => {
    // TODO: Navigate to AI chatbot for personal project creation
    alert('Personal project creation coming soon!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose a Language</Text>
      <Text style={styles.subtitle}>Select a language to start learning or create your own project</Text>

      <ScrollView style={styles.scrollView}>
        {languages.map((language) => (
          <TouchableOpacity
            key={language.id}
            style={styles.languageButton}
            onPress={() => handleLanguageSelect(language)}
          >
            <Text style={styles.flag}>{language.flag}</Text>
            <Text style={styles.languageName}>{language.name}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.languageButton, styles.personalButton]}
          onPress={handlePersonalProject}
        >
          <Text style={styles.plus}>➕</Text>
          <Text style={styles.languageName}>Create Personal Project</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => navigation.navigate('LearningTypeSelection', { selectedLanguage: null })}
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
    paddingHorizontal: 20,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  languageButton: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  flag: {
    fontSize: 30,
    marginRight: 15,
  },
  plus: {
    fontSize: 30,
    marginRight: 15,
    color: '#4A90E2',
  },
  languageName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  personalButton: {
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#4A90E2',
    backgroundColor: '#f0f8ff',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    color: '#666',
    fontSize: 16,
  },
});

export default LanguageSelectionScreen;

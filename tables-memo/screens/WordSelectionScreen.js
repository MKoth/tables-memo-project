import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';

const WordSelectionScreen = ({ navigation }) => {
  const [selectedWords, setSelectedWords] = useState([]);

  // Mock data - TODO: Load from data source
  const words = [
    { id: 'hola', word: 'hola', translation: 'hello', category: 'greetings' },
    { id: 'gracias', word: 'gracias', translation: 'thank you', category: 'greetings' },
    { id: 'casa', word: 'casa', translation: 'house', category: 'nouns' },
    { id: 'comer', word: 'comer', translation: 'to eat', category: 'verbs' },
    { id: 'agua', word: 'agua', translation: 'water', category: 'nouns' },
    { id: 'amigo', word: 'amigo', translation: 'friend', category: 'nouns' },
  ];

  const toggleWordSelection = (wordId) => {
    setSelectedWords(prev =>
      prev.includes(wordId)
        ? prev.filter(id => id !== wordId)
        : [...prev, wordId]
    );
  };

  const handleStartExercise = () => {
    if (selectedWords.length === 0) {
      alert('Please select at least one word');
      return;
    }
    navigation.navigate('Exercise', { type: 'word', words: selectedWords });
  };

  const renderWord = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.wordCard,
        selectedWords.includes(item.id) && styles.selectedCard
      ]}
      onPress={() => toggleWordSelection(item.id)}
    >
      <View style={styles.cardContent}>
        <Text style={styles.word}>{item.word}</Text>
        <Text style={styles.translation}>{item.translation}</Text>
        {selectedWords.includes(item.id) && (
          <Text style={styles.checkmark}>✓</Text>
        )}
      </View>
      <Text style={styles.category}>{item.category}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Words to Practice</Text>
      <Text style={styles.subtitle}>
        Choose words to train with flashcards and exercises
      </Text>

      <FlatList
        data={words}
        renderItem={renderWord}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('TableSelection')}
        >
          <Text style={styles.secondaryButtonText}>Practice Tables Instead</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            selectedWords.length === 0 && styles.disabledButton
          ]}
          onPress={handleStartExercise}
          disabled={selectedWords.length === 0}
        >
          <Text style={styles.primaryButtonText}>
            Start Exercise ({selectedWords.length})
          </Text>
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
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 5,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    paddingHorizontal: 20,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  wordCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedCard: {
    borderColor: '#4A90E2',
    borderWidth: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  word: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  translation: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  checkmark: {
    fontSize: 20,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  category: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 10,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default WordSelectionScreen;

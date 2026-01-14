import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';

const TopicSelectionScreen = ({ navigation, route }) => {
  const { selectedLanguage, learningType } = route.params || {};
  const [selectedTopics, setSelectedTopics] = useState([]);

  // Mock data based on learning type
  const getTopicsData = () => {
    if (learningType === 'tables') {
      return [
        {
          id: 'present_tense',
          name: 'Present Tense',
          description: 'Regular and irregular verbs in present tense',
          tags: ['verbs', 'grammar', 'beginner'],
          rows: ['I', 'You', 'He/She', 'We', 'You (pl)', 'They'],
          columns: ['hablar (to speak)', 'comer (to eat)', 'vivir (to live)'],
        },
        {
          id: 'past_tense',
          name: 'Past Tense',
          description: 'Preterite conjugation for regular verbs',
          tags: ['verbs', 'grammar', 'intermediate'],
          rows: ['Yo', 'Tú', 'Él/Ella', 'Nosotros', 'Vosotros', 'Ellos'],
          columns: ['hablar', 'comer', 'vivir'],
        },
        {
          id: 'future_tense',
          name: 'Future Tense',
          description: 'Future tense conjugation',
          tags: ['verbs', 'grammar', 'intermediate'],
          rows: ['Yo', 'Tú', 'Él/Ella', 'Nosotros', 'Vosotros', 'Ellos'],
          columns: ['hablar', 'comer', 'vivir'],
        },
      ];
    } else {
      // Word topics
      return [
        {
          id: 'greetings',
          name: 'Greetings & Introductions',
          description: 'Common phrases for meeting people',
          tags: ['conversation', 'beginner'],
          wordCount: 15,
        },
        {
          id: 'food_drink',
          name: 'Food & Drink',
          description: 'Vocabulary for restaurants and cooking',
          tags: ['nouns', 'daily-life', 'beginner'],
          wordCount: 25,
        },
        {
          id: 'family',
          name: 'Family Members',
          description: 'Words for describing family relationships',
          tags: ['nouns', 'personal', 'beginner'],
          wordCount: 12,
        },
      ];
    }
  };

  const topics = getTopicsData();

  const toggleTopicSelection = (topicId) => {
    setSelectedTopics(prev =>
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const handleStartSelection = () => {
    if (selectedTopics.length === 0) {
      alert(`Please select at least one ${learningType === 'tables' ? 'table' : 'word topic'}`);
      return;
    }

    // Navigate to exercise selection
    navigation.navigate('ExerciseSelection', {
      selectedLanguage,
      learningType,
      selectedTopics,
    });
  };

  const renderTopic = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.topicCard,
        selectedTopics.includes(item.id) && styles.selectedCard
      ]}
      onPress={() => toggleTopicSelection(item.id)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.topicName}>{item.name}</Text>
        {selectedTopics.includes(item.id) && (
          <Text style={styles.checkmark}>✓</Text>
        )}
      </View>
      <Text style={styles.topicDescription}>{item.description}</Text>
      <View style={styles.tagsContainer}>
        {item.tags.map(tag => (
          <Text key={tag} style={styles.tag}>{tag}</Text>
        ))}
      </View>
      <Text style={styles.topicSize}>
        {learningType === 'tables'
          ? `${item.rows.length} × ${item.columns.length} table`
          : `${item.wordCount} words`
        }
      </Text>
    </TouchableOpacity>
  );

  const getTitle = () => {
    if (learningType === 'tables') {
      return 'Select Grammar Tables';
    } else {
      return 'Select Word Topics';
    }
  };

  const getSubtitle = () => {
    if (learningType === 'tables') {
      return 'Choose one or more grammar tables to practice with';
    } else {
      return 'Choose word topics to build your vocabulary';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{getTitle()}</Text>
      <Text style={styles.subtitle}>{getSubtitle()}</Text>

      <FlatList
        data={topics}
        renderItem={renderTopic}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.secondaryButtonText}>← Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            selectedTopics.length === 0 && styles.disabledButton
          ]}
          onPress={handleStartSelection}
          disabled={selectedTopics.length === 0}
        >
          <Text style={styles.primaryButtonText}>
            Continue ({selectedTopics.length})
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
    fontFamily: 'ComicSansMS',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    paddingHorizontal: 20,
    fontFamily: 'ComicSansMS',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  topicCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  topicName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'ComicSansMS',
  },
  checkmark: {
    fontSize: 20,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  topicDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
    fontFamily: 'ComicSansMS',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  tag: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    marginRight: 8,
    marginBottom: 5,
    fontFamily: 'ComicSansMS',
  },
  topicSize: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    fontFamily: 'ComicSansMS',
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
    fontFamily: 'ComicSansMS',
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
    fontFamily: 'ComicSansMS',
  },
});

export default TopicSelectionScreen;

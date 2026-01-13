import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
} from 'react-native';

const TableSelectionScreen = ({ navigation }) => {
  const [selectedTables, setSelectedTables] = useState([]);

  // Mock data - TODO: Load from data source
  const tables = [
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
    {
      id: 'subjunctive',
      name: 'Present Subjunctive',
      description: 'Subjunctive mood conjugation',
      tags: ['verbs', 'grammar', 'advanced'],
      rows: ['que yo', 'que tú', 'que él/ella', 'que nosotros', 'que vosotros', 'que ellos'],
      columns: ['hable', 'coma', 'viva'],
    },
  ];

  const toggleTableSelection = (tableId) => {
    setSelectedTables(prev =>
      prev.includes(tableId)
        ? prev.filter(id => id !== tableId)
        : [...prev, tableId]
    );
  };

  const handleStartExercise = () => {
    if (selectedTables.length === 0) {
      alert('Please select at least one table');
      return;
    }
    // TODO: Pass selected tables to exercise
    navigation.navigate('Exercise', { type: 'table', tables: selectedTables });
  };

  const renderTable = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.tableCard,
        selectedTables.includes(item.id) && styles.selectedCard
      ]}
      onPress={() => toggleTableSelection(item.id)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.tableName}>{item.name}</Text>
        {selectedTables.includes(item.id) && (
          <Text style={styles.checkmark}>✓</Text>
        )}
      </View>
      <Text style={styles.tableDescription}>{item.description}</Text>
      <View style={styles.tagsContainer}>
        {item.tags.map(tag => (
          <Text key={tag} style={styles.tag}>{tag}</Text>
        ))}
      </View>
      <Text style={styles.tableSize}>
        {item.rows.length} × {item.columns.length} table
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Tables to Practice</Text>
      <Text style={styles.subtitle}>
        Choose one or more grammar tables to train with
      </Text>

      <FlatList
        data={tables}
        renderItem={renderTable}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('WordSelection')}
        >
          <Text style={styles.secondaryButtonText}>Practice Words Instead</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            selectedTables.length === 0 && styles.disabledButton
          ]}
          onPress={handleStartExercise}
          disabled={selectedTables.length === 0}
        >
          <Text style={styles.primaryButtonText}>
            Start Exercise ({selectedTables.length})
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
  tableCard: {
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
  tableName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  checkmark: {
    fontSize: 20,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  tableDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
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
  },
  tableSize: {
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

export default TableSelectionScreen;

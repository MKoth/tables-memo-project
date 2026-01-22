import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import VerticalArrowedScrollView from '../shared/VerticalArrowedScrollView';
import { OPERATION_TYPES, allGrammarRulesExplanations, tableGrammarRuleMapping } from '../../utils/types';
import AnimatedWord from './AnimatedWord';

// Transformation Tools Component
const TransformationTools = ({
  operation,
  sequence,
  selectedLetters,
  showVariants,
  onHintToggle,
  onSubmitRemoval,
  onVariantSelect,
  onShowVariants
}) => {
  if (!operation) return null;

  return (
    <View style={styles.toolsContainer}>
      <TouchableOpacity
        style={styles.hintButton}
        onPress={onHintToggle}
      >
        <Text style={styles.hintButtonText}>
          {sequence.showHint ? 'Hide Tip' : 'Show Tip'}
        </Text>
      </TouchableOpacity>

      {sequence.showHint && (
        <Text style={styles.grammaticalTip}>
          {allGrammarRulesExplanations['spanish-present'][tableGrammarRuleMapping['spanish-present-hablar'][sequence.colIndex]]}
        </Text>
      )}

      {operation.type === OPERATION_TYPES.DELETE && (
        <TouchableOpacity
          style={[styles.actionButton, selectedLetters.size > 0 && styles.activeButton]}
          onPress={onSubmitRemoval}
          disabled={selectedLetters.size === 0}
        >
          <Text style={[styles.actionButtonText, selectedLetters.size > 0 && styles.activeButtonText]}>
            Remove Selected Letters
          </Text>
        </TouchableOpacity>
      )}

      {(operation.type === OPERATION_TYPES.INSERT) && (
        <View style={styles.variantContainer}>
          <Text style={styles.variantLabel}>Choose what to insert:</Text>
          <View style={styles.variantsGrid}>
            {operation.variants.map(variant => (
              <TouchableOpacity
                key={variant}
                style={styles.variantButton}
                onPress={() => onVariantSelect(variant)}
              >
                <Text style={styles.variantText}>{variant}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

// Main Transformation Workspace Component
const TransformationWorkspace = forwardRef(({
  sequence,
  operation,
  selectedLetters,
  showVariants,
  wordDisplayRef,
  onLetterPress,
  onHintToggle,
  onSubmitRemoval,
  onVariantSelect,
  onShowVariants
}, ref) => {
  return (
    <VerticalArrowedScrollView
      ref={ref}
      style={styles.workspaceContainer}
      scrollViewStyle={{ flex: 1 }}
      contentContainerStyle={styles.workspaceContent}
      arrowsContainerStyle={styles.arrowsContainer}
      upArrowStyle={styles.upArrow}
      downArrowStyle={styles.downArrow}
    >
      <AnimatedWord
        sequence={sequence}
        operation={operation}
        selectedLetters={selectedLetters}
        wordDisplayRef={wordDisplayRef}
        onLetterPress={onLetterPress}
      />
      <TransformationTools
        operation={operation}
        sequence={sequence}
        selectedLetters={selectedLetters}
        showVariants={showVariants}
        onHintToggle={onHintToggle}
        onSubmitRemoval={onSubmitRemoval}
        onVariantSelect={onVariantSelect}
        onShowVariants={onShowVariants}
      />
    </VerticalArrowedScrollView>
  );
});

const styles = StyleSheet.create({
  workspaceContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toolsContainer: {
    alignItems: 'center',
  },
  hintButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  hintButtonText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'ComicSansMS',
  },
  grammaticalTip: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
    fontFamily: 'ComicSansMS',
  },
  actionButton: {
    backgroundColor: '#ddd',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  activeButton: {
    backgroundColor: '#4A90E2',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    fontFamily: 'ComicSansMS',
  },
  activeButtonText: {
    color: '#fff',
  },
  variantContainer: {
    width: '100%',
    alignItems: 'center',
  },
  variantLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    fontFamily: 'ComicSansMS',
  },
  variantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 12,
  },
  variantButton: {
    width: 70,
    height: 70,
    margin: 6,
    borderRadius: 12,
    backgroundColor: '#e6e6fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#a089d1',
  },
  variantText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'ComicSansMS',
  },
  workspaceContent: {
    paddingBottom: 20, // Extra padding at bottom for scroll
  },
  arrowsContainer: {
    // Custom positioning for transformation workspace
  },
  upArrow: {
    top: 20,
    right: 10,
  },
  downArrow: {
    bottom: 20,
    right: 10,
  },
});

export default TransformationWorkspace;

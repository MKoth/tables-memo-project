import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const VariantsList = ({
  variants,
  selectedVariant,
  onVariantSelect,
  usedVariants = [],
}) => {
  const variantRefs = useRef(variants.map(() => React.createRef())).current;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select a variant to place:</Text>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.variantsContainer}
      >
        {variants.map((variant, index) => {
          const isSelected = selectedVariant === variant;
          const isUsed = usedVariants.includes(variant);

          return (
            <View
              key={`${variant}-${index}`}
              ref={variantRefs[index]}
              style={[
                styles.variant,
                isSelected && styles.selectedVariant,
                isUsed && styles.usedVariant,
              ]}
            >
              <TouchableOpacity
                style={styles.variantTouchable}
                onPress={() => onVariantSelect(variant, variantRefs[index])}
                disabled={isUsed}
              >
                <Text style={[
                  styles.variantText,
                  isSelected && styles.selectedVariantText,
                  isUsed && styles.usedVariantText,
                ]}>
                  {variant}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
    textAlign: 'center',
  },
  scrollContainer: {
    maxHeight: '40vh',
  },
  variantsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  variant: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 6,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedVariant: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
    transform: [{ scale: 1.05 }],
  },
  usedVariant: {
    opacity: 0.4,
    backgroundColor: '#f0f0f0',
  },
  variantTouchable: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  variantText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
    fontWeight: '500',
  },
  selectedVariantText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  usedVariantText: {
    color: '#999',
  },
});

export default VariantsList;

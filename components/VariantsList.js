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
        showsVerticalScrollIndicator={false}
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
    padding: 12,
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 10,
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
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    textAlign: 'center',
    fontFamily: 'Comic Sans MS',
  },
  scrollContainer: {
    maxHeight: '20vh',
  },
  variantsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  variant: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 4,
    borderRadius: 6,
    backgroundColor: '#e6e6fa', // Light purple
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedVariant: {
    backgroundColor: '#a089d1', // Purple
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
    fontSize: 14,
    textAlign: 'center',
    color: '#333',
    fontWeight: '500',
    fontFamily: 'Comic Sans MS',
  },
  selectedVariantText: {
    color: '#452563', // Dark purple
    fontWeight: 'bold',
    fontFamily: 'Comic Sans MS',
  },
  usedVariantText: {
    color: '#999',
    fontFamily: 'Comic Sans MS',
  },
});

export default VariantsList;

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { mockData } from '../../data/mockData';

const MarketplaceScreen = () => {
  const projects = mockData.offsetProjects;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🌍 Carbon Marketplace</Text>
        <Text style={styles.subtitle}>Invest in verified green projects</Text>
      </View>

      <View style={styles.content}>
        {projects.map(project => (
          <View key={project.id} style={styles.card}>
            <Image source={{ uri: project.image }} style={styles.cardImage} />
            <View style={styles.cardContent}>
              <Text style={styles.projectTitle}>{project.name}</Text>
              <Text style={styles.projectLocation}>📍 {project.location}</Text>
              <Text style={styles.projectDescription}>
                {project.description}
              </Text>
              <View style={styles.footer}>
                <Text style={styles.price}>${project.costPerTon}/ton</Text>
                <TouchableOpacity style={styles.button}>
                  <Text style={styles.buttonText}>Offset Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#2e7d32',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: 150,
  },
  cardContent: {
    padding: 16,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  projectLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  projectDescription: {
    fontSize: 14,
    color: '#444',
    marginBottom: 16,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  button: {
    backgroundColor: '#2e7d32',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default MarketplaceScreen;

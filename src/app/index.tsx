import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Círculos de fondo decorativos */}
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
        <View style={[styles.circle, styles.circle4]} />
        <View style={[styles.circle, styles.circle5]} />

        {/* Encabezado / Logo */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="compass" size={28} color="#064e3b" />
            <Text style={styles.logoText}>rumbo</Text>
          </View>
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="menu" size={22} color="#064e3b" />
          </TouchableOpacity>
        </View>

        {/* Contenido Central */}
        <View style={styles.content}>
          <View style={styles.badge}>
            <Ionicons name="sparkles" size={14} color="#166534" />
            <Text style={styles.badgeText}>Tutor con IA generativa</Text>
          </View>

          <Text style={styles.title}>
            Cada ciclo, un paso{'\n'}más cerca de tu meta
          </Text>

          <Text style={styles.subtitle}>
            Rumbo te explica lo difícil a tu medida y avanza contigo, desde la primera duda hasta tu logro.
          </Text>

          {/* Botones principales */}
          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>Empezar mi ruta</Text>
            <Ionicons name="arrow-forward" size={18} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.7}>
            <Text style={styles.secondaryButtonText}>Ya tengo cuenta</Text>
          </TouchableOpacity>
        </View>

        {/* Barra horizontal / Tarjetas de pasos */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsScroll}
        >
          <View style={[styles.stepCard, { transform: [{ rotate: '-9deg' }] }]}>
            <Ionicons name="help-circle-outline" size={24} color="#166534" />
            <Text style={styles.cardText}>Preguntas</Text>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: '30%' }]} />
            </View>
          </View>

          <View style={[styles.stepCard, { transform: [{ rotate: '-6deg' }] }]}>
            <Ionicons name="bulb-outline" size={24} color="#166534" />
            <Text style={styles.cardText}>Entiendes</Text>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: '50%' }]} />
            </View>
          </View>

          <View style={[styles.stepCard, styles.cardHighlight, { transform: [{ rotate: '-3deg' }] }]}>
            <Ionicons name="journal-outline" size={24} color="#166534" />
            <Text style={styles.cardText}>Practicas</Text>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: '70%' }]} />
            </View>
          </View>

          <View style={[styles.stepCard, styles.cardActive, { transform: [{ rotate: '4deg' }] }]}>
            <Ionicons name="trophy-outline" size={24} color="#ffffff" />
            <Text style={[styles.cardText, styles.cardTextActive]}>Logras</Text>
            <View style={[styles.progressBg, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
              <View style={[styles.progressFill, { width: '100%', backgroundColor: '#bbf7d0' }]} />
            </View>
          </View>

          <View style={[styles.stepCard, styles.cardDark, { transform: [{ rotate: '8deg' }] }]}>
            <Ionicons name="flag-outline" size={28} color="#bbf7d0" />
            <Text style={[styles.cardText, styles.cardTextActive]}>Tu rumbo</Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    position: 'relative',
    overflow: 'hidden',
  },
  // Círculos de fondo
  circle: {
    position: 'absolute',
    borderRadius: 9999,
  },
  circle1: {
    width: 600,
    height: 600,
    bottom: -300,
    left: -100,
    backgroundColor: '#dcfce7',
  },
  circle2: {
    width: 500,
    height: 500,
    bottom: -250,
    left: -50,
    backgroundColor: '#d1fae5',
  },
  circle3: {
    width: 400,
    height: 400,
    bottom: -200,
    left: 0,
    backgroundColor: '#bbf7d0',
  },
  circle4: {
    width: 300,
    height: 300,
    bottom: -150,
    left: 50,
    backgroundColor: '#a7f3d0',
  },
  circle5: {
    width: 200,
    height: 200,
    bottom: -100,
    left: 100,
    backgroundColor: '#86efac',
  },
  // Encabezado
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    zIndex: 10,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#064e3b',
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Contenido
  content: {
    paddingHorizontal: 28,
    marginTop: 40,
    alignItems: 'center',
    zIndex: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#052e16',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#525252',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  primaryButton: {
    width: '100%',
    height: 52,
    backgroundColor: '#15803d',
    borderRadius: 999,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#166534',
    fontSize: 16,
    fontWeight: '700',
  },
  // Tarjetas inferiores
  cardsScroll: {
    paddingHorizontal: 20,
    paddingTop: 40,
    alignItems: 'flex-end',
    gap: 12,
    zIndex: 10,
  },
  stepCard: {
    width: 70,
    height: 110,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#08261a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  cardHighlight: {
    backgroundColor: '#dcfce7',
  },
  cardActive: {
    backgroundColor: '#15803d',
  },
  cardDark: {
    backgroundColor: '#042f2e',
  },
  cardText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#052e16',
  },
  cardTextActive: {
    color: '#ffffff',
  },
  progressBg: {
    width: '100%',
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#15803d',
    borderRadius: 2,
  },
});
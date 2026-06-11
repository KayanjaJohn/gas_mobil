import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Leaf, Recycle, Zap, Droplets } from 'lucide-react-native';

interface Stat {
  icon: string;
  value: string;
  label: string;
}

const STATS: Stat[] = [
  { icon: 'leaf', value: '14', label: 'Trees equivalent' },
  { icon: 'recycle', value: '8', label: 'Cylinders recycled' },
  { icon: 'zap', value: '320', label: 'kWh clean energy' },
  { icon: 'droplets', value: '1,200L', label: 'Water saved' },
];

export default function GreenScreen() {
  const router = useRouter();

  const getIcon = (iconName: string) => {
    const props = { size: 22, color: '#3ddc84' };
    switch (iconName) {
      case 'leaf': return <Leaf {...props} />;
      case 'recycle': return <Recycle {...props} />;
      case 'zap': return <Zap {...props} />;
      case 'droplets': return <Droplets {...props} />;
      default: return <Leaf {...props} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={18} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Green Impact</Text>
        </View>

        <View style={styles.ecoStat}>
          <Text style={styles.ecoIcon}>🌱</Text>
          <Text style={styles.ecoBig}>128 kg</Text>
          <Text style={styles.ecoLabel}>CO₂ SAVED THIS YEAR</Text>
        </View>

        <View style={styles.ecoGrid}>
          {STATS.map((stat, index) => (
            <View key={index} style={styles.ecoMini}>
              <View style={styles.ecoMiniIcon}>
                {getIcon(stat.icon)}
              </View>
              <Text style={styles.ecoMiniValue}>{stat.value}</Text>
              <Text style={styles.ecoMiniLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.championCard}>
          <Text style={styles.championTitle}>🏆 Eco Champion</Text>
          <Text style={styles.championText}>
            You're in the top 5% of greenest customers in Kampala. Keep refilling instead of buying new!
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070b14',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1a2236',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  ecoStat: {
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 18,
    backgroundColor: '#0e1a14',
    borderWidth: 1,
    borderColor: '#1a3a26',
    alignItems: 'center',
  },
  ecoIcon: {
    fontSize: 42,
  },
  ecoBig: {
    fontSize: 38,
    fontWeight: '800',
    color: '#3ddc84',
    letterSpacing: -1,
    marginTop: 8,
  },
  ecoLabel: {
    color: '#8A93A6',
    fontSize: 12,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  ecoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 14,
  },
  ecoMini: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#101827',
    borderWidth: 1,
    borderColor: '#1F2A3D',
    borderRadius: 16,
    padding: 16,
  },
  ecoMiniIcon: {
    marginBottom: 6,
  },
  ecoMiniValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  ecoMiniLabel: {
    color: '#8A93A6',
    fontSize: 11,
    marginTop: 2,
  },
  championCard: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#101723',
    borderWidth: 1,
    borderColor: '#1F2A3D',
  },
  championTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
  },
  championText: {
    color: '#8A93A6',
    fontSize: 12,
    lineHeight: 18,
  },
});
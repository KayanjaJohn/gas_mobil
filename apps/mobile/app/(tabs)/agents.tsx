import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Flame, Search, Send } from 'lucide-react-native';

interface Station {
  id: number;
  name: string;
  city: string;
  region: string;
  sold: number;
  status: string;
}

const STATIONS: Station[] = [
  { id: 1, name: 'Shell Kampala Road', city: 'Kampala', region: 'Central', sold: 109, status: 'OPEN' },
  { id: 2, name: 'Shell Entebbe Road', city: 'Kampala', region: 'Central', sold: 78, status: 'OPEN' },
  { id: 3, name: 'Total Jinja Main', city: 'Jinja', region: 'Eastern', sold: 64, status: 'OPEN' },
  { id: 4, name: 'Shell Mbarara', city: 'Mbarara', region: 'Western', sold: 52, status: 'CLOSED' },
];

const REGIONS: string[] = ['All', 'Central', 'Western', 'Eastern', 'Northern'];

export default function AgentsScreen() {
  const router = useRouter();
  const [activeRegion, setActiveRegion] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filtered: Station[] = STATIONS.filter(s => {
    const matchesRegion = activeRegion === 'All' || s.region === activeRegion;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRegion && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={18} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Partner Stations</Text>
        </View>

        <View style={styles.netsum}>
          <View style={styles.netsumLabel}>
            <Flame size={14} color="#1484FF" />
            <Text style={styles.netsumLabelText}>NETWORK SUMMARY</Text>
          </View>
          <View style={styles.netsumNums}>
            <View>
              <Text style={styles.netsumBig}>62</Text>
              <Text style={styles.netsumSmall}>Partner Stations</Text>
            </View>
            <View>
              <Text style={styles.netsumBig}>5,215</Text>
              <Text style={styles.netsumSmall}>Cylinders Sold (30d)</Text>
            </View>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <Search size={14} color="#8A93A6" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search station or city..."
            placeholderTextColor="#8A93A6"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          <View style={styles.tabs}>
            {REGIONS.map(region => (
              <TouchableOpacity
                key={region}
                style={[styles.tab, activeRegion === region && styles.tabActive]}
                onPress={() => setActiveRegion(region)}
              >
                <Text style={[styles.tabText, activeRegion === region && styles.tabTextActive]}>
                  {region}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Text style={styles.showingText}>Showing {filtered.length} of {STATIONS.length} stations</Text>

        <View style={styles.list}>
          {filtered.map(station => (
            <View key={station.id} style={styles.station}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{station.name.substring(0, 2).toUpperCase()}</Text>
              </View>
              <View style={styles.stationInfo}>
                <View style={styles.stationTitleRow}>
                  <Text style={styles.stationName}>{station.name}</Text>
                  <View style={[styles.pill, station.status === 'CLOSED' && styles.pillClosed]}>
                    <Text style={[styles.pillText, station.status === 'CLOSED' && styles.pillTextClosed]}>
                      {station.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.stationSub}>{station.city} · {station.region} Region</Text>
                <Text style={styles.stationSold}>{station.sold} sold (30d)</Text>
              </View>
              <TouchableOpacity style={styles.sendBtn}>
                <Send size={14} color="#1484FF" />
              </TouchableOpacity>
            </View>
          ))}
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
  netsum: {
    backgroundColor: '#101723',
    borderWidth: 1,
    borderColor: '#1F2A3D',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 14,
  },
  netsumLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  netsumLabelText: {
    fontSize: 11,
    color: '#1484FF',
    letterSpacing: 0.15,
    fontWeight: '700',
  },
  netsumNums: {
    flexDirection: 'row',
    gap: 14,
  },
  netsumBig: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  netsumSmall: {
    color: '#8A93A6',
    fontSize: 11,
  },
  searchWrap: {
    position: 'relative',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  searchIcon: {
    position: 'absolute',
    left: 14,
    top: 14,
    zIndex: 1,
  },
  searchInput: {
    width: '100%',
    backgroundColor: '#101723',
    borderWidth: 1,
    borderColor: '#1F2A3D',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    paddingLeft: 40,
    color: '#E6EAF2',
    fontSize: 13,
  },
  tabsScroll: {
    marginHorizontal: 16,
    marginBottom: 10,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: '#101723',
    borderWidth: 1,
    borderColor: '#1F2A3D',
  },
  tabActive: {
    backgroundColor: '#1484FF',
    borderColor: '#1484FF',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A93A6',
  },
  tabTextActive: {
    color: '#fff',
  },
  showingText: {
    color: '#8A93A6',
    fontSize: 12,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  list: {
    paddingHorizontal: 16,
    gap: 10,
  },
  station: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#101723',
    borderWidth: 1,
    borderColor: '#1F2A3D',
    borderRadius: 14,
    padding: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(34,197,94,.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#3ddc84',
    fontWeight: '700',
    fontSize: 14,
  },
  stationInfo: {
    flex: 1,
  },
  stationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stationName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  pill: {
    fontSize: 10,
    fontWeight: '700',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(34,197,94,.15)',
  },
  pillClosed: {
    backgroundColor: 'rgba(239,68,68,.15)',
  },
  pillText: {
    color: '#34d399',
    textTransform: 'uppercase',
    letterSpacing: 0.08,
    fontSize: 10,
  },
  pillTextClosed: {
    color: '#ff6b6b',
  },
  stationSub: {
    color: '#8A93A6',
    fontSize: 12,
    marginTop: 2,
  },
  stationSold: {
    color: '#1484FF',
    fontSize: 11,
    marginTop: 3,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(59,130,246,.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
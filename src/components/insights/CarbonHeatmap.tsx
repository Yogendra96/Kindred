import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { startOfWeek, addDays, format, isAfter } from 'date-fns';
import { MotiView } from 'moti';
import { spatialColors, animations } from '../../theme/theme';
import { parseEntryDate } from '../../utils/insightsEngine';

interface HistoryEntry {
  date: string;
  footprint: {
    total: number;
    transportation: number;
    food: number;
    energy: number;
    waste: number;
  };
}

interface CarbonHeatmapProps {
  history: HistoryEntry[];
}

export const CarbonHeatmap: React.FC<CarbonHeatmapProps> = ({ history }) => {
  const [selectedDay, setSelectedDay] = useState<{
    date: string;
    value: number;
  } | null>(null);

  // Group history entries by date for fast lookup
  const historyMap = useMemo(() => {
    const map = new Map<string, number>();
    history.forEach(entry => {
      map.set(entry.date, entry.footprint.total);
    });
    return map;
  }, [history]);

  // Generate 12 weeks of dates aligned to start of week (Sunday)
  const gridData = useMemo(() => {
    const weeksCount = 12;
    const totalDays = weeksCount * 7;

    // Find the Sunday 11 weeks ago to start the grid
    const today = new Date();
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 0 }); // Sunday
    const gridStart = addDays(startOfCurrentWeek, -(weeksCount - 1) * 7);

    const weeks: any[][] = [];
    const now = new Date();

    for (let w = 0; w < weeksCount; w++) {
      const weekDays: any[] = [];
      for (let d = 0; d < 7; d++) {
        const currentDate = addDays(gridStart, w * 7 + d);
        const formattedDate = format(currentDate, 'yyyy-MM-dd');
        const isFuture = isAfter(currentDate, now);

        const value = isFuture ? -1 : historyMap.get(formattedDate) ?? 0;
        weekDays.push({
          date: formattedDate,
          displayDate: format(currentDate, 'MMM dd, yyyy'),
          dayOfWeek: format(currentDate, 'EEEE'),
          value,
          isFuture,
        });
      }
      weeks.push(weekDays);
    }
    return weeks;
  }, [historyMap]);

  // Helper to determine the color of each square
  const getSquareColor = (value: number, isFuture: boolean) => {
    if (isFuture) return 'rgba(255, 255, 255, 0.02)'; // Invisible/future
    if (value === 0) return 'rgba(255, 255, 255, 0.08)'; // No emissions logged / baseline glass
    if (value <= 5) return '#38EF7D'; // Low (Green)
    if (value <= 12) return '#F2C94C'; // Medium (Yellow)
    return '#FF3B30'; // High (Red)
  };

  const getSquareOpacity = (value: number, isFuture: boolean) => {
    if (isFuture) return 0.2;
    if (value === 0) return 0.5;
    return 1.0;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity Heatmap</Text>
        {selectedDay ? (
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={styles.tooltip}
          >
            <Text style={styles.tooltipText}>
              {selectedDay.date}:{' '}
              <Text style={styles.tooltipValue}>{selectedDay.value.toFixed(1)} kg CO₂</Text>
            </Text>
          </MotiView>
        ) : (
          <Text style={styles.subtitle}>Tap a cell to see details</Text>
        )}
      </View>

      <View style={styles.gridWrapper}>
        {/* Day of week labels */}
        <View style={styles.labelsColumn}>
          <Text style={styles.dayLabel}>Su</Text>
          <Text style={styles.dayLabel}>Mo</Text>
          <Text style={styles.dayLabel}>Tu</Text>
          <Text style={styles.dayLabel}>We</Text>
          <Text style={styles.dayLabel}>Th</Text>
          <Text style={styles.dayLabel}>Fr</Text>
          <Text style={styles.dayLabel}>Sa</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.heatmapGrid}>
            {gridData.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.weekColumn}>
                {week.map((day, dayIndex) => {
                  const color = getSquareColor(day.value, day.isFuture);
                  const opacity = getSquareOpacity(day.value, day.isFuture);

                  return (
                    <TouchableOpacity
                      key={dayIndex}
                      disabled={day.isFuture}
                      onPress={() =>
                        setSelectedDay({
                          date: day.displayDate,
                          value: Math.max(0, day.value),
                        })
                      }
                      style={[
                        styles.daySquare,
                        {
                          backgroundColor: color,
                          opacity,
                        },
                      ]}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendText}>Less</Text>
        <View style={[styles.legendSquare, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]} />
        <View style={[styles.legendSquare, { backgroundColor: '#38EF7D' }]} />
        <View style={[styles.legendSquare, { backgroundColor: '#F2C94C' }]} />
        <View style={[styles.legendSquare, { backgroundColor: '#FF3B30' }]} />
        <Text style={styles.legendText}>More</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: spatialColors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: spatialColors.textSecondary,
  },
  tooltip: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  tooltipText: {
    fontSize: 11,
    color: spatialColors.textSecondary,
  },
  tooltipValue: {
    color: '#fff',
    fontWeight: 'bold',
  },
  gridWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelsColumn: {
    justifyContent: 'space-between',
    height: 120,
    marginRight: 8,
    paddingVertical: 2,
  },
  dayLabel: {
    fontSize: 10,
    color: spatialColors.textSecondary,
    textAlign: 'right',
    width: 16,
  },
  scrollContent: {
    paddingRight: 16,
  },
  heatmapGrid: {
    flexDirection: 'row',
    gap: 4,
  },
  weekColumn: {
    flexDirection: 'column',
    gap: 4,
  },
  daySquare: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 4,
  },
  legendText: {
    fontSize: 10,
    color: spatialColors.textSecondary,
    marginHorizontal: 4,
  },
  legendSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});

import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  currentStreak,
  isComplete,
  longestStreak,
  progress,
  sampleChallenges,
  toggleCheckIn,
  validateChallenge,
  type Challenge,
} from "../../lib/challenges";

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function ChallengesScreen() {
  const today = todayKey();
  const [challenges, setChallenges] = useState<Challenge[]>(() => sampleChallenges(today));
  const [name, setName] = useState("");
  const [target, setTarget] = useState("30");
  const [error, setError] = useState<string | null>(null);

  const update = (next: Challenge) => setChallenges(challenges.map((c) => (c.id === next.id ? next : c)));

  const add = () => {
    const problem = validateChallenge(name, target);
    setError(problem);
    if (problem) return;
    setChallenges([...challenges, { id: `${Date.now()}`, name: name.trim(), targetDays: Number(target.trim()), checkIns: [] }]);
    setName("");
  };

  return (
    <FlatList
      style={styles.container}
      data={challenges}
      keyExtractor={(c) => c.id}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={styles.form}>
          <Text style={styles.formTitle}>New challenge</Text>
          <View style={styles.formRow}>
            <TextInput
              style={[styles.input, styles.flex]}
              placeholder="e.g. Walk 10k steps"
              value={name}
              onChangeText={setName}
              accessibilityLabel="Challenge name"
            />
            <TextInput
              style={[styles.input, styles.days]}
              keyboardType="number-pad"
              value={target}
              onChangeText={setTarget}
              accessibilityLabel="Target days"
            />
            <Pressable style={styles.addButton} onPress={add} accessibilityRole="button" accessibilityLabel="Add challenge">
              <Ionicons name="add" size={24} color="#fff" />
            </Pressable>
          </View>
          {error && <Text style={styles.error}>{error}</Text>}
        </View>
      }
      renderItem={({ item }) => {
        const done = item.checkIns.includes(today);
        const pct = progress(item);
        const streak = currentStreak(item.checkIns, today);
        return (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.name}>{item.name}</Text>
              {isComplete(item) && <Ionicons name="trophy" size={20} color="#C9A227" accessibilityLabel="Completed" />}
            </View>
            <View
              style={styles.track}
              accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: item.targetDays, now: new Set(item.checkIns).size }}
            >
              <View style={[styles.fill, { width: `${pct * 100}%` }]} />
            </View>
            <Text style={styles.meta}>
              {new Set(item.checkIns).size}/{item.targetDays} days · 🔥 {streak} day streak · best {longestStreak(item.checkIns)}
            </Text>
            <View style={styles.row}>
              <Pressable
                style={[styles.checkButton, done && styles.checkButtonDone]}
                onPress={() => update(toggleCheckIn(item, today))}
                accessibilityRole="button"
                accessibilityState={{ checked: done }}
              >
                <Text style={[styles.checkText, done && styles.checkTextDone]}>{done ? "Done today ✓ (undo)" : "Check in today"}</Text>
              </Pressable>
              <Pressable
                onPress={() => setChallenges(challenges.filter((c) => c.id !== item.id))}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${item.name}`}
                hitSlop={10}
              >
                <Ionicons name="trash-outline" size={20} color="#B00020" />
              </Pressable>
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  form: { padding: 16, gap: 8 },
  formTitle: { fontSize: 15, fontWeight: "600", color: "#333" },
  formRow: { flexDirection: "row", gap: 8 },
  flex: { flex: 1 },
  days: { width: 64, textAlign: "center" },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#ccc", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  addButton: { backgroundColor: "#4A90D9", borderRadius: 8, width: 48, alignItems: "center", justifyContent: "center" },
  error: { color: "#B00020" },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginHorizontal: 16, marginBottom: 12, gap: 8, elevation: 2 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  name: { flex: 1, fontSize: 17, fontWeight: "600", color: "#333" },
  track: { height: 10, backgroundColor: "#E3ECF7", borderRadius: 5, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: "#4A90D9" },
  meta: { fontSize: 13, color: "#666" },
  checkButton: { flex: 1, borderWidth: 1, borderColor: "#4A90D9", borderRadius: 8, paddingVertical: 10, alignItems: "center" },
  checkButtonDone: { backgroundColor: "#4A90D9" },
  checkText: { color: "#4A90D9", fontWeight: "600" },
  checkTextDone: { color: "#fff" },
});

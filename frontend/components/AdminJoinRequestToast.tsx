// frontend/components/AdminJoinRequestToast.tsx

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
// import { XMarkIcon } from "react-native-heroicons/outline";

type Props = {
  count: number;
  displayIdentity: string | null;
  onAccept: () => void;
  onReject: () => void;
  onDismiss: () => void;
  isDarkMode?: boolean;
};

const AdminJoinRequestToast = ({
  count,
  displayIdentity,
  onAccept,
  onReject,
  onDismiss,
  isDarkMode = false,
}: Props) => {
  if (count === 0) return null;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? "#1E293B" : "#E7F5FF" },
      ]}
    >
      <Text style={styles.text}>
        {count} join request{count > 1 ? "s" : ""} pending from {displayIdentity}
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity onPress={onAccept}>
          <Text style={styles.accept}>Accept</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onReject}>
          <Text style={styles.reject}>Reject</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={onDismiss} style={styles.close}>
        {/* <XMarkIcon size={18} color="#555" /> */}
        <Text style={{ color: isDarkMode ? "#AAA" : "#555" }}>×</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
  },
  text: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 14,
    marginRight: 20,
  },
  accept: {
    color: "#1971c2",
    fontWeight: "600",
  },
  reject: {
    color: "#c92a2a",
    fontWeight: "600",
  },
  close: {
    position: "absolute",
    top: 6,
    right: 6,
    padding: 4,
  },
});

export default AdminJoinRequestToast;

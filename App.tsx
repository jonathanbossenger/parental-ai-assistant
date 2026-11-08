import { mount, Text, View } from "nsh";

function App() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#f4f6fb",
        padding: 24,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 480,
          backgroundColor: "#ffffff",
          borderRadius: 24,
          padding: 32,
          gap: 16,
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "bold", color: "#5263c5" }}>PARENTAL AI ASSISTANT</Text>
        <Text style={{ fontSize: 32, fontWeight: "bold", color: "#20243a", textAlign: "center" }}>
          Welcome to your family’s AI companion
        </Text>
        <Text style={{ fontSize: 17, color: "#60677d", textAlign: "center", lineHeight: 25 }}>
          A thoughtful space to help your family explore AI together. More helpful tools are coming soon.
        </Text>
      </View>
    </View>
  );
}

mount(App);

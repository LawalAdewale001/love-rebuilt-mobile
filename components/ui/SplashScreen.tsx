import React from "react";
import { ImageBackground, StatusBar, StyleSheet, View } from "react-native";

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        transparent
        backgroundColor="transparent"
      />
      <ImageBackground
        source={require("@/assets/images/bg-image.png")}
        style={styles.bgWrapper}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E86673",
    justifyContent: "center",
    alignItems: "center",
  },
  bgWrapper: {
    width: "100%",
    height: "100%",
  },
});

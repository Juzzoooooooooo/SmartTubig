#include <Arduino.h>
#include <math.h>

// Standalone pH probe firmware. Enter two measured buffer points to enable pH.
constexpr uint8_t SENSOR_PIN = 34;  // ESP32 ADC1; usable while Wi-Fi is active.
constexpr bool CALIBRATED = false;
constexpr float POINT_1_MV = 0.0f;
constexpr float POINT_1_PH = 4.0f;
constexpr float POINT_2_MV = 0.0f;
constexpr float POINT_2_PH = 7.0f;
constexpr unsigned long SAMPLE_INTERVAL_MS = 2000;

float readMillivolts() {
  uint32_t total = 0;
  for (int i = 0; i < 10; ++i) {
    total += analogReadMilliVolts(SENSOR_PIN);
    delay(10);
  }
  return total / 10.0f;
}

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);
  analogSetPinAttenuation(SENSOR_PIN, ADC_11db);
}

void loop() {
  const float mv = readMillivolts();
  if (!CALIBRATED || fabsf(POINT_2_MV - POINT_1_MV) < 1.0f) {
    Serial.printf("{\"sensor\":\"ph\",\"raw_mv\":%.1f,\"ph\":null}\n", mv);
  } else {
    const float ph = POINT_1_PH + (mv - POINT_1_MV) *
        (POINT_2_PH - POINT_1_PH) / (POINT_2_MV - POINT_1_MV);
    if (isfinite(ph) && ph >= 0.0f && ph <= 14.0f)
      Serial.printf("{\"sensor\":\"ph\",\"raw_mv\":%.1f,\"ph\":%.2f}\n", mv, ph);
    else
      Serial.printf("{\"sensor\":\"ph\",\"raw_mv\":%.1f,\"ph\":null,"
                    "\"error\":\"out_of_range\"}\n", mv);
  }
  delay(SAMPLE_INTERVAL_MS);
}

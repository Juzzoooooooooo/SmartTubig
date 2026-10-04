#include <Arduino.h>
#include <math.h>

// Standalone turbidity probe firmware. Calibrate with two known NTU samples.
constexpr uint8_t SENSOR_PIN = 32;  // ESP32 ADC1.
constexpr bool CALIBRATED = false;
constexpr float POINT_1_MV = 0.0f;
constexpr float POINT_1_NTU = 0.0f;
constexpr float POINT_2_MV = 0.0f;
constexpr float POINT_2_NTU = 0.0f;
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
    Serial.printf("{\"sensor\":\"turbidity\",\"raw_mv\":%.1f,"
                  "\"turbidity_ntu\":null}\n", mv);
  } else {
    const float ntu = POINT_1_NTU + (mv - POINT_1_MV) *
        (POINT_2_NTU - POINT_1_NTU) / (POINT_2_MV - POINT_1_MV);
    if (isfinite(ntu) && ntu >= 0.0f)
      Serial.printf("{\"sensor\":\"turbidity\",\"raw_mv\":%.1f,"
                    "\"turbidity_ntu\":%.2f}\n", mv, ntu);
    else
      Serial.printf("{\"sensor\":\"turbidity\",\"raw_mv\":%.1f,"
                    "\"turbidity_ntu\":null,\"error\":\"out_of_range\"}\n", mv);
  }
  delay(SAMPLE_INTERVAL_MS);
}

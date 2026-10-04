#include <Arduino.h>
#include <math.h>

// Standalone TDS probe firmware. Calibrate with two known solutions in ppm.
constexpr uint8_t SENSOR_PIN = 35;  // ESP32 ADC1.
constexpr bool CALIBRATED = false;
constexpr float POINT_1_MV = 0.0f;
constexpr float POINT_1_PPM = 0.0f;
constexpr float POINT_2_MV = 0.0f;
constexpr float POINT_2_PPM = 0.0f;
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
    Serial.printf("{\"sensor\":\"tds\",\"raw_mv\":%.1f,\"tds_ppm\":null}\n", mv);
  } else {
    const float ppm = POINT_1_PPM + (mv - POINT_1_MV) *
        (POINT_2_PPM - POINT_1_PPM) / (POINT_2_MV - POINT_1_MV);
    if (isfinite(ppm) && ppm >= 0.0f)
      Serial.printf("{\"sensor\":\"tds\",\"raw_mv\":%.1f,\"tds_ppm\":%.2f}\n", mv, ppm);
    else
      Serial.printf("{\"sensor\":\"tds\",\"raw_mv\":%.1f,\"tds_ppm\":null,"
                    "\"error\":\"out_of_range\"}\n", mv);
  }
  delay(SAMPLE_INTERVAL_MS);
}

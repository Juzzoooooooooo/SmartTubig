#include <Arduino.h>
#include <math.h>

// Standalone ultrasonic water-level firmware. Adjust these to the installed tank.
constexpr uint8_t TRIG_PIN = 5;
constexpr uint8_t ECHO_PIN = 18;
constexpr float EMPTY_DISTANCE_CM = 180.0f;
constexpr float FULL_DISTANCE_CM = 20.0f;
constexpr float TANK_CAPACITY_LITERS = 4000.0f;
constexpr unsigned long SAMPLE_INTERVAL_MS = 2000;

float readDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  const unsigned long echoUs = pulseIn(ECHO_PIN, HIGH, 30000);
  return echoUs ? echoUs * 0.0343f / 2.0f : NAN;
}

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  digitalWrite(TRIG_PIN, LOW);
  pinMode(ECHO_PIN, INPUT);
}

void loop() {
  if (EMPTY_DISTANCE_CM <= FULL_DISTANCE_CM) {
    Serial.println("{\"sensor\":\"ultrasonic_level\",\"error\":\"invalid_tank_geometry\"}");
    delay(SAMPLE_INTERVAL_MS);
    return;
  }

  const float distanceCm = readDistanceCm();
  if (!isfinite(distanceCm) || distanceCm < FULL_DISTANCE_CM - 5.0f ||
      distanceCm > EMPTY_DISTANCE_CM + 5.0f) {
    Serial.println("{\"sensor\":\"ultrasonic_level\",\"error\":\"invalid_echo\"}");
  } else {
    const float levelPercent = constrain(
        100.0f * (EMPTY_DISTANCE_CM - distanceCm) /
            (EMPTY_DISTANCE_CM - FULL_DISTANCE_CM),
        0.0f, 100.0f);
    Serial.printf("{\"sensor\":\"ultrasonic_level\",\"distance_cm\":%.2f,"
                  "\"water_level_percent\":%.2f,\"volume_liters\":%.2f}\n",
                  distanceCm, levelPercent,
                  TANK_CAPACITY_LITERS * levelPercent / 100.0f);
  }
  delay(SAMPLE_INTERVAL_MS);
}

# Separate sensor firmware

Each folder contains one independent Arduino `.ino` sketch for an ESP32. Open and flash one sketch at a time. They do not depend on, or include, one another.

| Project | Sensor | ESP32 pins | Serial output |
| --- | --- | --- | --- |
| [`ultrasonic_level.ino`](ultrasonic_level/ultrasonic_level.ino) | Ultrasonic water level | trigger GPIO 5, echo GPIO 18 | distance, level %, tank volume |
| [`ph.ino`](ph/ph.ino) | pH probe and analog interface | ADC1 GPIO 34 | raw mV, calibrated pH |
| [`tds.ino`](tds/tds.ino) | TDS probe and analog interface | ADC1 GPIO 35 | raw mV, calibrated ppm |
| [`turbidity.ino`](turbidity/turbidity.ino) | Turbidity probe and analog interface | ADC1 GPIO 32 | raw mV, calibrated NTU |

Each program prints one JSON reading every two seconds at 115200 baud. These are standalone sensor programs for wiring and calibration. They do not send data to the dashboard; that needs a device API and an integration step. The present dashboard still uses demo data.

## Upload one sensor

Install the ESP32 board package in Arduino IDE. Open the `.ino` file for the sensor you want, select your ESP32 board and port, then click **Upload**. Open Serial Monitor at **115200 baud** to see the JSON readings. The sketch folder and `.ino` filename match, as required by Arduino IDE. Flashing another sketch replaces the program on that ESP32. To run all four at once, use four ESP32 boards or combine their code in a future integrated firmware.

## Set up the hardware

1. Confirm the actual ESP32 board, sensor module, and pin wiring. The pins above are example assignments and can be changed at the top of each `.ino` file.
2. Keep **every ESP32 input at 3.3 V or below**. A 5 V ultrasonic echo needs a level shifter or resistor divider. Analog probe interface outputs may also need attenuation or a divider. Never connect an unknown sensor output directly to an ESP32 pin.
3. For water level, measure the ultrasonic distance to the water at empty and full and set `EMPTY_DISTANCE_CM`, `FULL_DISTANCE_CM`, and `TANK_CAPACITY_LITERS`.
4. For each analog sensor, first use the `raw_mv` output to measure two known reference samples. Enter their voltage and known pH, ppm, or NTU values in that sensor's code, then set `CALIBRATED` to `true`. Until then the calculated field is `null`, so placeholder calibration cannot be mistaken for a real reading.
5. Recalibrate the probes as required by their hardware. The linear two-point conversion is a starting point; TDS in particular changes with water temperature, so add temperature compensation if needed. Water quality readings are indicators and do not replace laboratory testing.

#include <LiquidCrystal.h>
#include <SoftwareSerial.h>

// init bluetooth module
const int txPin = 3, rxPin = 2;
SoftwareSerial bluetooth(rxPin, txPin); 

// init lcd display
const int rs = 7, en = 8, d4 = 9, d5 = 10, d6 = 11, d7 = 12;
LiquidCrystal lcd(rs, en, d4, d5, d6, d7);


void setup() {
  // setup serial log
  Serial.begin(9600);
  // setup bluetooth
  bluetooth.begin(9600);
  // setup lcd
  lcd.begin(16, 2);
}

void loop() {
  // put your main code here, to run repeatedly:
  // lcd.setCursor(0, 1);
  // print the number of seconds since reset:

  // bluetooth.println("hello world");
  // lcd.print(millis() / 1000);
}
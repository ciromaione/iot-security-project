#include <LiquidCrystal.h>
#include <SoftwareSerial.h>
#include <Crypto.h>
#include <Hash.h>
#include <Ed25519.h>
#include <SHA256.h>
#include <RNG.h>

#define DEVICE_ID "00000001"
#define BT_TX 3
#define BT_RX 2
#define LCD_RS 7
#define LCD_EN 8
#define LCD_D4 9
#define LCD_D5 10
#define LCD_D6 11
#define LCD_D7 12
#define HASH_SIZE 32

// init bluetooth module
SoftwareSerial bluetooth(BT_RX, BT_TX); 

// init lcd display
LiquidCrystal lcd(LCD_RS, LCD_EN, LCD_D4, LCD_D5, LCD_D6, LCD_D7);


// ED25519 private/public key
uint8_t private_key[32];
uint8_t public_key[32];

// init SHA256 for hashing
SHA256 sha256;
Hash *hash = &sha256;

// username
String username;

void setup() {
  // setup serial log
  Serial.begin(9600);
  
  // setup bluetooth
  bluetooth.begin(9600);
  
  // setup lcd
  lcd.begin(16, 2);

  // setup random number generator
  RNG.begin("Ciro's code dispatcher");
}

void loop() {
  RNG.loop();
  // put your main code here, to run repeatedly:
  // lcd.setCursor(0, 1);
  // print the number of seconds since reset:

  // bluetooth.println("hello world");
  // lcd.print(millis() / 1000);
}

void bind_device() {
  Ed25519::generatePrivateKey(private_key);
  Ed25519::derivePublicKey (public_key, private_key);
  bluetooth.write(private_key);
  bluetooth.write(DEVICE_ID);
  username = bluetooth.readString();
}

void generate_code() {
  uint8_t code[8];
  uint8_t code_hash[HASH_SIZE];
  uint8_t signature[64];

  while(true) {
    if(RNG.available(sizeof(code))) {
      RNG.rand(code, sizeof(code);
      break;
    }
    Serial.println("Accumulating entropy for RNG..");
    RNG.loop();
  }
  hash->reset();
  hash->update(code, strlen(code));
  hash->finalize(code_hash, sizeof(code_hash));

  Ed25519::sign(signature, private_key, public_key, code_hash, sizeof(code_hash));

  bluetooth.write(code_hash);
  bluetooth.write(signature);
}

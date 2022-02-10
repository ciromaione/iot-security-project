#include <LiquidCrystal.h>
#include <SoftwareSerial.h>
#include <Crypto.h>
#include <Hash.h>
#include <Ed25519.h>
#include <SHA256.h>

#define DEVICE_ID "00001"
#define BT_TX 3
#define BT_RX 2
#define LCD_RS 7
#define LCD_EN 8
#define LCD_D4 9
#define LCD_D5 10
#define LCD_D6 11
#define LCD_D7 12
#define HASH_SIZE 32
#define BTN_PIN 5

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

// is device been already bound
bool is_bound;

// nonce
String nonce;

void setup() {
  // setup serial log
  Serial.begin(9600);

  // setup btn
  pinMode(BTN_PIN, INPUT_PULLUP);
  
  // setup bluetooth
  bluetooth.begin(9600);
  
  // setup lcd
  lcd.begin(16, 2);

  lcd.print("ID: ");
  lcd.print(DEVICE_ID);

  is_bound = false;

  randomSeed(analogRead(0));

  nonce = gen_rand_alphanueric_code(8);
  lcd.setCursor(0, 1);
  lcd.print("Nonce: ");
  lcd.print(nonce);
}

void bind_device() {
  Ed25519::generatePrivateKey(private_key);
  Ed25519::derivePublicKey (public_key, private_key);
  Serial.print("public key: ");
  Serial.println((char*) public_key);
  bluetooth.println(DEVICE_ID);
  delay(100);
  bluetooth.println(nonce);
  delay(100);
  send_bytes(public_key, 32);
}

void generate_code() {
  String code;
  char code_array[6];
  uint8_t code_hash[HASH_SIZE];
  uint8_t signature[64];

  code = gen_rand_alphanueric_code(5);
  code.toCharArray(code_array, 6);
  Serial.print("Code: ");
  Serial.println(code);
  
  hash->reset();
  hash->update(code_array, strlen(code_array));
  hash->finalize(code_hash, sizeof(code_hash));

  Serial.print("Hash: ");
  for(int i=0; i<32; ++i) {
    Serial.print(code_hash[i], HEX);
  }
  Serial.println("*");

  Ed25519::sign(signature, private_key, public_key, code_hash, sizeof(code_hash));

  bluetooth.println(DEVICE_ID);
  delay(100);
  send_bytes(code_hash, HASH_SIZE);
  send_bytes(signature, 64);
  lcd.setCursor(0, 1);
  lcd.print("CODE: ");
  lcd.print(code + "     ");
}

void send_bytes(uint8_t *buffer, int len) {
  for(int i = 0; i < len; ++i) {
    bluetooth.write(buffer[i]);
  }
}

String gen_rand_alphanueric_code(int n) {
  String code = "";
  for(int i = 0; i < n; ++i) {
    byte randomValue = random(0, 36);
    char letter = randomValue + 'a';
    if(randomValue >= 26)
      letter = (randomValue - 26) + '0';
    code += letter;
  }
  return code;
}

void loop() {
  if(digitalRead(BTN_PIN) == LOW) {
    if(!is_bound) {
      lcd.setCursor(0, 1);
      lcd.print("Start binding..");
      bind_device();
      lcd.setCursor(0, 1);
      lcd.print("Binding done!  ");
      is_bound = true;
    } else {
      lcd.setCursor(0, 1);
      lcd.print("Start code gen..");
      generate_code();
    }
    delay(1000);
  }
}

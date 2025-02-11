#include <WiFi.h>
#include <WiFiClient.h>
#include <WebServer.h>
#include <uri/UriBraces.h>
#include "DHTesp.h"
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <WiFiClientSecure.h>


#define WIFI_SSID "Wokwi-GUEST"
#define WIFI_PASSWORD ""
#define WIFI_CHANNEL 6

WebServer server(80);

const int PINO_DHT = 15;
const int LED = 2;

String temperatura = "0";
String umidade = "0";
String apiToken = "";

DHTesp sensorDHT;

void login() {
    if (WiFi.status() == WL_CONNECTED) {
        WiFiClientSecure client; 
        HTTPClient http;

        client.setInsecure();
        
        String serverName = "https://web-ii-n2-a.vercel.app/logar";
        http.begin(client, serverName);
        http.addHeader("Content-Type", "application/json");

        String payloadLogin = "{ \"email\": \"aluno@ifce.com\", \"senha\": \"12345678\" }";
        int httpResponseCode = http.POST(payloadLogin);

        if (httpResponseCode > 0) {
            String response = http.getString();
            Serial.println("Login Response: " + response);
            
            StaticJsonDocument<200> doc;
            DeserializationError error = deserializeJson(doc, response);
            if (!error && doc.containsKey("token")) {
                apiToken = doc["token"].as<String>();
                Serial.println("Token recebido: " + apiToken);
            } else {
                Serial.println("Erro ao parsear JSON de login ou token não encontrado");
            }
        } else {
            Serial.print("Erro ao fazer login, código HTTP: ");
            Serial.println(httpResponseCode);
        }
        http.end();
    }
}


void setup() {
    Serial.begin(115200);
    sensorDHT.setup(PINO_DHT, DHTesp::DHT22);

    WiFi.begin(WIFI_SSID, WIFI_PASSWORD, WIFI_CHANNEL);
    Serial.print("Connecting to WiFi ");
    Serial.print(WIFI_SSID);
    while (WiFi.status() != WL_CONNECTED) {
        delay(100);
        Serial.print(".");
    }
    Serial.println(" Connected!");

    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());

    server.begin();
    Serial.println("HTTP server started");

    pinMode(LED, OUTPUT);
    
    login();
}

void loop() {
    TempAndHumidity dados = sensorDHT.getTempAndHumidity();
    temperatura = String(dados.temperature, 2);
    umidade = String(dados.humidity, 1);
    Serial.println("Temperatura: " + temperatura);
    Serial.println("Umidade: " + umidade);

    if (WiFi.status() == WL_CONNECTED && apiToken != "") {
        WiFiClientSecure client; 
        HTTPClient http;

        client.setInsecure();
        
        String serverName = "https://web-ii-n2-a.vercel.app";

        // Enviar temperatura
        String rotaTemperatura = serverName + "/temperatura";
        http.begin(client, rotaTemperatura);
        http.addHeader("Content-Type", "application/json");
        http.addHeader("authorization", "Bearer " + apiToken);
        
        String payloadTemperatura = "{ \"temperatura\": " + temperatura + " }";
        int httpResponseCode = http.POST(payloadTemperatura);

        Serial.print("HTTP Response code: ");
        Serial.println(httpResponseCode);

        if (httpResponseCode > 0) {
            String response = http.getString();
            Serial.println("Server Response: " + response);
        } else {
            Serial.println("Erro na requisição");
        }
        http.end();

        // Obter status da luz
        String rotaLuz = serverName + "/statusLuz";
        http.begin(client, rotaLuz);
        http.addHeader("authorization", "Bearer " + apiToken);
        
        int httpCode2 = http.GET();
        Serial.println(httpCode2);
        Serial.printf(http.errorToString(httpCode2).c_str());
        
        if (httpCode2 > 0) {
            String payloadLuz = http.getString();
            Serial.println(payloadLuz);
            
            if (payloadLuz == "Ligado") {
                digitalWrite(LED, HIGH);
            } else if (payloadLuz == "Desligado") {
                digitalWrite(LED, LOW);
            }
        }
        http.end();
    } else {
      Serial.println("Não foi possível conectar a API.");
    }
    delay(5000);
}

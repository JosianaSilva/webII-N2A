Compilar o código C:
```
avr-g++ -mmcu=atmega328p -Os -Wall -c main.cpp -o main.o
```

Criar o HEX
```
avr-objcopy -O ihex main.elf main.hex
```
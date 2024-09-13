#include <Windows.h>
#include "keyboard.h"

void pressKey(int key, int flags)
{
  INPUT input = {0};
  input.type = INPUT_KEYBOARD;
  input.ki.wVk = key;
  // TODO: Add mod flags
  SendInput(1, &input, sizeof(INPUT));
  input.ki.dwFlags = KEYEVENTF_KEYUP;
  SendInput(1, &input, sizeof(INPUT));
}

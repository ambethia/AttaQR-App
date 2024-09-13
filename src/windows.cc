#include <Windows.h>
#include "attaqr.h"

void pressKey(int key, int mod)
{
  INPUT input = {0};
  input.type = INPUT_KEYBOARD;

  if (mod != MOD_NONE) {
    input.ki.wVk = mod;
    SendInput(1, &input, sizeof(INPUT));
  }
  input.ki.wVk = key;
  SendInput(1, &input, sizeof(INPUT));

  input.ki.dwFlags = KEYEVENTF_KEYUP;
  
  SendInput(1, &input, sizeof(INPUT));
  if (mod != MOD_NONE) {
    input.ki.wVk = mod;
    SendInput(1, &input, sizeof(INPUT));
  }
}

AQPixel getPixel(size_t x, size_t y)
{
  HDC dc = GetDC(NULL);
  COLORREF cr = GetPixel(dc, x, y);
  ReleaseDC(NULL, dc);
  AQPixel pixel{GetRValue(cr), GetGValue(cr), GetBValue(cr)};
  return pixel;
}

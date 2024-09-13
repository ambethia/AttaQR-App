#include <Windows.h>
#include "attaqr.h"

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

AQPixel getPixel(size_t x, size_t y)
{
  HDC dc = GetDC(NULL);
  COLORREF cr = GetPixel(dc, x, y);
  ReleaseDC(NULL, dc);
  AQPixel pixel{GetRValue(cr), GetGValue(cr), GetBValue(cr)};
  return pixel;
}

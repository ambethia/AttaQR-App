#include <CoreGraphics/CoreGraphics.h>
#include "keyboard.h"

void pressKey(int key, int flags)
{
  CGEventRef evt = CGEventCreateKeyboardEvent(NULL, (CGKeyCode)key, kCGEventKeyDown);
  CGEventSetFlags(evt, flags);
  CGEventPost(kCGHIDEventTap, evt);
  CGEventSetType(evt, kCGEventKeyUp);
  CGEventPost(kCGHIDEventTap, evt);
  CFRelease(evt);
}

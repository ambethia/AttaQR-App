#include <CoreGraphics/CoreGraphics.h>
#include "attaqr.h"

void pressKey(int key, int mod)
{
  CGEventRef evt = CGEventCreateKeyboardEvent(NULL, (CGKeyCode)key, kCGEventKeyDown);
  CGEventSetFlags(evt, flags);
  CGEventPost(kCGHIDEventTap, evt);
  CGEventSetType(evt, kCGEventKeyUp);
  CGEventPost(kCGHIDEventTap, evt);
  CFRelease(evt);
}

AQPixel getPixel(size_t x, size_t y)
{
  CGDirectDisplayID displayID = CGMainDisplayID();
  CGColorSpaceRef colorSpace = CGColorSpaceCreateWithName(kCGColorSpaceSRGB);
  CGImageRef image = CGDisplayCreateImageForRect(displayID, CGRectMake(x, y, 1, 1));
  uint8_t *data = (uint8_t *)malloc(sizeof(uint8_t) * 4);
  CGContextRef context = CGBitmapContextCreate(data, 1, 1, 8, 4, colorSpace, kCGImageAlphaNoneSkipLast);
  CGColorSpaceRelease(colorSpace);
  CGContextDrawImage(context, CGRectMake(0, 0, 1, 1), image);
  CGContextRelease(context);
  CGImageRelease(image);
  AQPixel pixel{data[0], data[1], data[2]};
  free(data);
  return pixel;
}

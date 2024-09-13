#pragma once
#ifndef ATTAQR_H
#define ATTAQR_H
#include <cstdint>

#if !defined(IS_MACOS) && defined(__MACH__)
#define IS_MACOS
#include <CoreGraphics/CoreGraphics.h>
static const int MOD_ALT = kCGEventFlagMaskAlternate;
static const int MOD_CONTROL = kCGEventFlagMaskControl;
static const int MOD_SHIFT = kCGEventFlagMaskShift;
#endif

#if !defined(IS_WINDOWS) && defined(_WIN32)
#define IS_WINDOWS
#include <Windows.h>
#endif

static const int MOD_NONE = 0;

typedef struct _AQPixel
{
  uint8_t r;
  uint8_t g;
  uint8_t b;
} AQPixel;

AQPixel getPixel(size_t x, size_t y);

void pressKey(int key, int flags);

#endif // ATTAQR_H
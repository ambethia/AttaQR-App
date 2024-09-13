#pragma once
#ifndef ATTAQR_H
#define ATTAQR_H
#include <cstdint>

#if !defined(IS_MACOS) && defined(__MACH__)
#define IS_MACOS
#include <CoreGraphics/CoreGraphics.h>
static const int KEY_ALT = kCGEventFlagMaskAlternate;
static const int KEY_CONTROL = kCGEventFlagMaskControl;
static const int KEY_SHIFT = kCGEventFlagMaskShift;
#endif

#if !defined(IS_WINDOWS) && defined(_WIN32)
#define IS_WINDOWS
#include <Windows.h>
static const int KEY_ALT = VK_MENU;
static const int KEY_CONTROL = VK_CONTROL;
static const int KEY_SHIFT = VK_SHIFT;
#endif

static const int MOD_NONE = 0;

typedef struct _AQPixel
{
  uint8_t r;
  uint8_t g;
  uint8_t b;
} AQPixel;

AQPixel getPixel(size_t x, size_t y);

void pressKey(int key, int mod);

#endif // ATTAQR_H
#pragma once
#ifndef KEYBOARD_H
#define KEYBOARD_H

static const int MOD_NONE = 0;

#if defined(__MACH__)
#include <CoreGraphics/CoreGraphics.h>
static const int MOD_ALT = kCGEventFlagMaskAlternate;
static const int MOD_CONTROL = kCGEventFlagMaskControl;
static const int MOD_SHIFT = kCGEventFlagMaskShift;
#endif

void pressKey(int key, int flags);

#endif // KEYBOARD_H
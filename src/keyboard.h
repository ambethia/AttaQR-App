#pragma once
#ifndef KEYBOARD_H
#define KEYBOARD_H

#if defined(IS_WINDOWS)
#include <Windows.h>
#endif

#if defined(IS_MACOS)
#include <CoreGraphics/CoreGraphics.h>
static const int MOD_ALT = kCGEventFlagMaskAlternate;
static const int MOD_CONTROL = kCGEventFlagMaskControl;
static const int MOD_SHIFT = kCGEventFlagMaskShift;
#endif

static const int MOD_NONE = 0;


void pressKey(int key, int flags);

#endif // KEYBOARD_H
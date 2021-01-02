#pragma once
#ifndef ATTAQR_H
#define ATTAQR_H

#if !defined(IS_MACOS) && defined(__MACH__)
#define IS_MACOS
#endif

#if !defined(IS_WINDOWS) && defined(_WIN32)
#define IS_WINDOWS
#endif

typedef struct _AQPoint
{
  size_t x;
  size_t y;
} AQPoint;

AQPoint AQMakePoint(size_t x, size_t y);

typedef struct _AQSize
{
  size_t height;
  size_t width;
} AQSize;

AQSize AQMakeSize(size_t height, size_t width);

typedef struct _AQRect
{
  AQPoint origin;
  AQSize size;
} AQRect;

AQRect AQMakeRect(size_t x, size_t y, size_t h, size_t w);

#endif // ATTAQR_H
import { cn } from '@/lib/cn'

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
const ROW = 1.15 // em - wysokość jednej cyfry z zapasem na kształt szeryfowy
const box = { height: `${ROW}em`, lineHeight: `${ROW}em`, marginBlock: `-${(ROW - 1) / 2}em` }

/**
 * Licznik, w którym cyfry „księgują się” kolumna po kolumnie.
 *
 * Czysty CSS (transform na kompozytorze), bez JS animacji: każda kolumna to pasek 0-9 przesuwany
 * w pionie, z opóźnieniem rosnącym od prawej. Kolumny są kluczowane pozycją od prawej, więc
 * jedności zawsze zostają tym samym elementem. Treść dla czytników ekranu podaje rodzic.
 */
export function RollingNumber({ value, className }: { value: string; className?: string }) {
  const chars = [...value]
  return (
    <span aria-hidden="true" className={cn('num inline-flex items-end', className)}>
      {chars.map((char, index) => {
        const fromRight = chars.length - 1 - index
        if (!/\d/.test(char)) {
          // Separator w takim samym pudełku jak cyfry - inaczej jego linia bazowa obniża cały licznik.
          return (
            <span key={`s${fromRight}`} className="inline-block overflow-hidden whitespace-pre" style={box}>
              {char === ' ' ? ' ' : char}
            </span>
          )
        }
        const digit = Number(char)
        return (
          <span
            key={`d${fromRight}`}
            className="relative inline-block w-[1ch] overflow-hidden align-baseline"
            style={box}
          >
            <span
              className="absolute inset-x-0 top-0 flex flex-col transition-transform duration-[650ms] ease-calm motion-reduce:transition-none"
              style={{ transform: `translateY(${-digit * ROW}em)`, transitionDelay: `${fromRight * 45}ms` }}
            >
              {DIGITS.map(d => (
                <span key={d} className="block text-center" style={{ height: `${ROW}em`, lineHeight: `${ROW}em` }}>
                  {d}
                </span>
              ))}
            </span>
          </span>
        )
      })}
    </span>
  )
}

/**
 * Jednostka („zł”) w pudełku o tej samej wysokości i interlinii co cyfry - przy wyrównaniu do dołu
 * linie bazowe cyfr i jednostki pokrywają się niezależnie od rozmiaru fontu.
 */
export function RollingSuffix({ children, className }: { children: string; className?: string }) {
  return (
    <span aria-hidden="true" className="inline-block" style={box}>
      <span className={className}>{children}</span>
    </span>
  )
}

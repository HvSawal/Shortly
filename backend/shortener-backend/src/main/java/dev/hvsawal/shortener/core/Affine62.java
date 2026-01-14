package dev.hvsawal.shortener.core;

import java.math.BigInteger;

public final class Affine62 {
    private Affine62() {}

    public static BigInteger permute(BigInteger x, BigInteger a, BigInteger b, BigInteger m) {
        return a.multiply(x).add(b).mod(m);
    }

    public static BigInteger invert(BigInteger y, BigInteger aInv, BigInteger b, BigInteger m) {
        return aInv.multiply(y.subtract(b)).mod(m);
    }

    /** gcd(a, 62^L)=1 required for invertibility => a not divisible by 2 or 31. */
    public static BigInteger makeCoprimeTo62Power(BigInteger candidate, BigInteger m) {
        BigInteger a = candidate.mod(m);
        if (a.signum() == 0) a = BigInteger.ONE;

        // force odd (not divisible by 2)
        if (!a.testBit(0)) a = a.add(BigInteger.ONE);

        // avoid divisible by 31
        BigInteger thirtyOne = BigInteger.valueOf(31);
        if (a.mod(thirtyOne).signum() == 0) a = a.add(BigInteger.TWO);

        a = a.mod(m);
        if (a.signum() == 0) a = BigInteger.ONE;
        return a;
    }
}
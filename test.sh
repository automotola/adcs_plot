#!/bin/bash

( while [ 1 -lt 2 ]; do
    echo "main   ax=+0.0000 ay=+0.0000 az=+0.0000 gx=+000.0000 gy=+000.0000 gz=+000.0000 mx=+0.000000 my=+0.000000 mz=+0.000000 sx=-0.000000 sy=-0.000000 sz=+0.000000 tbmx=496 t1=00 t2=4096 t3=00 mrx=+00000 mry=+00004 mrz=+00000 mrr=024691 sv0=46836 sv1=0000 sv2=0000 sv3=0007"
    sleep 0.3
done ) \
| node server/index.js

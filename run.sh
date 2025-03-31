#!/bin/bash

until npm start; do
    echo Something went wrong. Retrying in 5 seconds...
    sleep 5
done

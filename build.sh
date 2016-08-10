#!/bin/sh

uglifyjs socket.js -m -c conditionals,sequences,evaluate,booleans,loops,hoist_funs,if_return,join-vars,cascade,properties,dead_code,drop_debugger,collapse_vars,negate_iife,pure_getters,keep_fargs -o socket.min.js --source-map socket.min.js.map --comments

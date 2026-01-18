package utils

import "math/rand"

func NewNumbers() []int {
	nums := rand.Perm(90)
	for i := range nums {
		nums[i]++
	}
	return nums
}

func ContainsInt(arr []int, v int) bool {
	for _, x := range arr {
		if x == v {
			return true
		}
	}
	return false
}

func RemoveInt(arr []int, v int) []int {
	out := arr[:0]
	for _, x := range arr {
		if x != v {
			out = append(out, x)
		}
	}
	return out
}

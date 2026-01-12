package utils

import "math/rand"

func NewNumbers() []int {
	nums := rand.Perm(90)
	for i := range nums {
		nums[i]++
	}
	return nums
}
